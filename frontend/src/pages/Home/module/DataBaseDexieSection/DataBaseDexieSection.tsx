import { db, type Objects } from '@/db';
import styles from './DataBaseDexieSection.module.css';
import { useCallback, useEffect, useMemo, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { CheckBox, Spinner } from '@/ui';
import Close from '@/assets/svg/bun.svg?react';
import cn from 'classnames';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import Sort from '@/assets/svg/sort.svg?react';
import debounce from 'lodash/debounce';
import { TableVirtuoso, type TableVirtuosoHandle } from 'react-virtuoso';

interface DataBaseDexieProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

// Интерфейс для активных фильтров
interface IFilters {
	obj_type?: string;
	change_type: string[];
	search_name?: string;
}

// Интерфейс состояния таблицы
interface ITableState {
	filters: IFilters;
	direction: 'next' | 'prev';
	sortBy?: string;
}

// Компонент секция отрисовки данных indexDB
export function DataBaseDexieSection({ className, ...props }: DataBaseDexieProps) {
	const [state, setState] = useState<ITableState>({
		filters: {
			change_type: ['changed', 'deleted', 'moved'],
		},
		direction: 'next',
	});
	const virtuosoRef = useRef<TableVirtuosoHandle>(null);

	// Храним текущие видимые индексы в рефе, чтобы знать, что подгружать при смене фильтров
	const visibleRangeRef = useRef({ start: 0, end: 100 });

	// Динамический счетчик для скроллбара
	const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
	const [isCalculating, setIsCalculating] = useState(false);
	// const totalCount = useLiveQuery(async () => {
	// 	const col = getFilteredCollection(state);
	// 	return await col.count();
	// }, [state]);

	const [visibleData, setVisibleData] = useState<Objects[]>([]);
	const [dataRange, setDataRange] = useState({ start: 0, end: 0 });
	// Реф для хранения последнего запрошенного диапазона, чтобы избежать дублей
	const lastRequestedRange = useRef('');

	// Оптимизированная функция загрузки
	const loadRange = useCallback(
		async (start: number, end: number) => {
			// Создаем "окно" побольше (запас сверху и снизу по 200 строк)
			const buffer = 200;
			const fetchStart = Math.max(0, start - buffer);
			const fetchCount = end - start + buffer * 2;

			// Ключ теперь включает состояние фильтров
			const stateKey = JSON.stringify(state);
			const rangeKey = `${fetchStart}-${fetchCount}-${stateKey}`;

			if (lastRequestedRange.current === rangeKey) return;
			lastRequestedRange.current = rangeKey;

			// Получаем отфильтрованную коллекцию
			const collection = getFilteredCollection(state);

			// Запрос к БД
			const items = await collection.offset(fetchStart).limit(fetchCount).toArray();

			// Обновляем состояние одним махом
			setDataRange({ start: fetchStart, end: fetchStart + items.length });
			setVisibleData(items);
		},
		[state],
	);

	// Дебаунс: запрашиваем данные только через 150мс после остановки скролла
	const debouncedLoadRange = useMemo(() => debounce(loadRange, 150), [loadRange]);

	const getFilteredCollection = (state: ITableState, forCount = false) => {
		const { change_type, obj_type, search_name } = state.filters;
		const { sortBy, direction } = state;

		let collection;

		// 1. Выбор индекса для сортировки (используем составные индексы из вашей схемы)
		if (forCount) {
			collection = db.objects.orderBy('obj_name');
		} else if (sortBy === 'obj_type') {
			collection = db.objects.orderBy('[obj_type+obj_name]');
		} else if (sortBy === 'change_type') {
			collection = db.objects.orderBy('[change_type+obj_name]');
		} else {
			collection = db.objects.orderBy('obj_name');
		}

		// 2. Направление
		if (direction === 'prev') {
			collection = collection.reverse();
		}

		// 3. Фильтрация (Внимание: .filter и .and на 200к записей могут притормаживать)
		// Стараемся использовать индексы там, где это возможно
		if (change_type.length < 3) {
			// Если выбраны не все типы
			collection = collection.filter(item => change_type.includes(item.change_type));
		}

		if (obj_type) {
			collection = collection.filter(item => item.obj_type === obj_type);
		}

		if (search_name) {
			const query = search_name.toLowerCase();
			collection = collection.filter(item => item.obj_name.toLowerCase().includes(query));
		}

		return collection;
	};

	// Сброс данных при изменении фильтров, чтобы не видеть старые данные на новых местах
	useEffect(() => {
		setVisibleData([]);
		setDataRange({ start: 0, end: 0 });
		lastRequestedRange.current = '';

		// 2. ПРИНУДИТЕЛЬНО вызываем загрузку для текущего места скролла
		// Используем без дебаунса, чтобы сработало мгновенно при клике на фильтр
		loadRange(visibleRangeRef.current.start, visibleRangeRef.current.end);

		// 3. Сбрасываем скролл в начало (опционально, если это нужно при фильтрации)
		virtuosoRef.current?.scrollToIndex(0);
	}, [loadRange, state]);

	// Эффект для подсчета количества
	useEffect(() => {
		let isCancelled = false;

		const updateCount = async () => {
			// 1. Включаем спиннер сразу при изменении state
			setIsCalculating(true);

			try {
				// Для count сортировка (orderBy) не нужна — это ускорит процесс
				const col = getFilteredCollection(state, true);
				const count = await col.count();

				if (!isCancelled) {
					setTotalCount(count);
				}
			} catch (err) {
				console.error('Ошибка подсчета:', err);
			} finally {
				if (!isCancelled) {
					setIsCalculating(false);
				}
			}
		};

		updateCount();

		return () => {
			isCancelled = true;
		};
	}, [state]);

	// Функция изменения сортировки
	const changeSort = (sortBy: string) => {
		setState(prev => {
			const next = { ...prev };
			next.sortBy = sortBy;
			next.direction = next.direction == 'next' ? 'prev' : 'next';
			return next;
		});
	};

	// Функция задания фильтра кликом по полю яцейки тела таблици
	const handleClickToSort = (field: keyof IFilters, value: string) => {
		setState((prev: ITableState) => {
			const next = { ...prev };
			if (field != 'change_type') {
				next['filters'][field] = value;
			}
			return next;
		});
	};

	// Функция сброса фильтра по выбранному полю
	const handleClearFilters = (field: keyof IFilters) => {
		setState((prev: ITableState) => {
			const next = { ...prev };
			if (field in next.filters) {
				delete next['filters'][field];
			}

			return next;
		});
	};

	// Функция изменения фильтра по полю change_type
	const handleCheckboxChange = (type: string) => {
		let arr = [...state.filters.change_type];
		if (arr.includes(type)) {
			arr = arr.filter(el => el !== type);
		} else {
			arr.push(type);
		}

		setState(prev => {
			const next = { ...prev };
			next.filters.change_type = arr;
			return next;
		});
	};

	// Блок заколовка компонента
	const title = useMemo(() => {
		return (
			<h3 className={styles.title}>
				Работа с Dexie
				{isCalculating ? <Spinner className={styles.spinner} /> : <span>{totalCount ?? 0}</span>}
			</h3>
		);
	}, [totalCount, isCalculating]); // Зависим от обоих состояний

	// Кнопка сострелками направления фильтрации для ячеек шапки таблицы
	const buttonSort = (direction: string, targetSort: boolean, sortBy: string) => {
		if (targetSort) {
			return (
				<button className={cn(styles.sort_btn, styles.active)} onClick={() => changeSort(sortBy)}>
					{direction == 'next' ? <SortUp /> : <SortDown />}
				</button>
			);
		}
		return (
			<button className={cn(styles.sort_btn)} onClick={() => changeSort(sortBy)}>
				<Sort />
			</button>
		);
	};

	const table = useMemo(() => {
		return (
			<TableVirtuoso
				totalCount={totalCount}
				overscan={700} // Чем больше, тем меньше белых пятен, но больше нагрузка на DOM
				rangeChanged={({ startIndex, endIndex }) => {
					visibleRangeRef.current = { start: startIndex, end: endIndex };
					if (startIndex < dataRange.start || endIndex > dataRange.end) {
						debouncedLoadRange(startIndex, endIndex);
					}
				}}
				className={styles.table}
				fixedHeaderContent={() => (
					<tr>
						<th className={styles.th}>
							<div>
								<span>uid</span>
								<span className={styles.grow}></span>
								{buttonSort(state.direction, state.sortBy == 'obj_name', 'obj_name')}
								<button
									className={cn(styles.sort_btn, {
										[styles.hide]: !('obj_name' in state.filters),
									})}
									onClick={() => handleClearFilters('obj_name' as keyof IFilters)}
								>
									<Close />
								</button>
							</div>
						</th>
						<th className={styles.th}>
							<div>
								<span>obj_type</span>
								<span className={styles.grow}></span>
								{buttonSort(state.direction, state.sortBy == 'obj_type', 'obj_type')}
								<button
									className={cn(styles.sort_btn, styles.active, {
										[styles.hide]: !('obj_type' in state.filters),
									})}
									onClick={() => handleClearFilters('obj_type' as keyof IFilters)}
								>
									<Close />
								</button>
							</div>
						</th>

						<th className={styles.th}>
							<div>
								<span>change_type</span>
							</div>
						</th>
					</tr>
				)}
				itemContent={index => {
					// Ищем объект в нашем текущем кеше
					const item = visibleData[index - dataRange.start];

					if (!item) {
						// Чтобы не было прыжков, возвращаем пустую строку фиксированной высоты
						return (
							<>
								<td className={styles.td}>...</td>
								<td className={styles.td}>...</td>
								<td className={styles.td}>...</td>
							</>
						);
					}

					return (
						<>
							<>
								<td className={styles.td}>{item.obj_name}</td>
								<td
									className={cn(styles.td, styles.td_filtered)}
									onClick={() => handleClickToSort('obj_type', item.obj_type)}
								>
									{item.obj_type}
								</td>
								<td className={styles.td}>{item.change_type}</td>
							</>
						</>
					);
				}}
			/>
		);
	}, [
		dataRange.end,
		dataRange.start,
		debouncedLoadRange,
		state.direction,
		state.filters,
		state.sortBy,
		totalCount,
		visibleData,
	]);

	// Блок чекбоксов фильтрации по полю change_type
	const checkboxes = useMemo(() => {
		return (
			<div className={styles.checkboxes}>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('changed')}
						checked={state.filters.change_type.includes('changed')}
					/>
					Изменённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('deleted')}
						checked={state.filters.change_type.includes('deleted')}
					/>
					Удалённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('moved')}
						checked={state.filters.change_type.includes('moved')}
					/>
					Перемещённые
				</label>
			</div>
		);
	}, [handleCheckboxChange]);

	// if (!totalCount) return <div>Загрузка структуры базы...</div>;

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{checkboxes}
		</section>
	);
}
