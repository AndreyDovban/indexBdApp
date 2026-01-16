import { db } from '@/db';
import styles from './DataBaseDexieSection.module.css';
import { useMemo, useState, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckBox, Spinner } from '@/ui';
import Close from '@/assets/svg/bun.svg?react';
import cn from 'classnames';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import Sort from '@/assets/svg/sort.svg?react';

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
	const [loading, setLoading] = useState<boolean>(false);

	const result = useLiveQuery(async () => {
		setLoading(true);

		try {
			const { change_type, obj_type, search_name } = state.filters;
			const { sortBy } = state;
			const { direction } = state;

			// 1. Используется приоритетный фильтр через составной индекс
			let collection = db.objects.toCollection();

			// 2. Определение индекса сортировки
			if (sortBy === 'obj_type') {
				collection = db.objects.orderBy('[obj_type+obj_name]');
			} else if (sortBy === 'change_type') {
				collection = db.objects.orderBy('[change_type+obj_name]');
			} else {
				// По умолчанию сортировка по первичному ключу (obj_name)
				collection = db.objects.toCollection();
			}

			// 3. Если не выбран не один тип изменения возвращается пустой массив
			if (change_type.length == 0) {
				return { items: [], filteredCount: 0 };
			}

			// 4. Определение направления сортировки
			if (direction === 'prev') {
				collection = collection.reverse();
			}

			// 5. Добавление фильтра на вхождение в массив change_type
			if (change_type.length > 0) {
				collection = collection.and(item => change_type.includes(item.change_type));
			}

			//  Используется составной индекс [change_type+obj_name] для нескольких значений
			// if (change_type.length == 1) {
			// 	collection = db.objects
			// 		.where('[change_type+obj_name]')
			// 		.between([change_type[0], ''], [change_type[0], '\uffff']);
			// } else if (change_type.length == 2) {
			// 	collection = db.objects
			// 		.where('[change_type+obj_name]')
			// 		.between([change_type[0], ''], [change_type[0], '\uffff'])
			// 		.or('[change_type+obj_name]')
			// 		.between([change_type[1], ''], [change_type[1], '\uffff']);
			// } else if (change_type.length == 0) {
			// 	return { items: [], filteredCount: 0, totalCount };
			// } else {
			// 	collection = db.objects.toCollection();
			// }

			// 6. Добавление фильтра на точное равенство obj_type
			if (obj_type) {
				collection = collection.and(item => item.obj_type === obj_type);
			}

			// 7. Добавление фильтра на вхождение строки в obj_name (аналог SQL LIKE %str%)
			if (search_name) {
				const query = search_name.toLowerCase();
				collection = collection.and(item => item.obj_name.toLowerCase().includes(query));
			}

			// 8. Подсчёт общего количества подходящих записей (до применения limit)
			let filteredCount = 0;
			if (search_name || obj_type || change_type.length != 3) {
				filteredCount = await collection.count();
			}

			// 9. Получение данныч с ограничением (пагинацией)
			const items = await collection.limit(100).toArray();

			return {
				items,
				filteredCount,
			};
		} finally {
			setLoading(false);
		}
	}, [state]);

	const { items = [], filteredCount = 0 } = result || {};

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
		// console.log('title render');
		return (
			<h3 className={styles.title}>
				Работа с Dexie{' '}
				{items == undefined || loading ? (
					<Spinner className={styles.spinner} />
				) : (
					<span>{filteredCount} / totalCount</span>
				)}
			</h3>
		);
	}, [filteredCount, loading]);

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

	// Блок таблица
	const table = useMemo(() => {
		// console.log('table render');
		return (
			<div className={styles.wrap}>
				<table className={styles.table}>
					{items && (
						<thead className={styles.thead}>
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
						</thead>
					)}

					<tbody className={styles.tbody}>
						{items &&
							items.map(el => {
								return (
									<tr key={el.obj_name} className={styles.tr}>
										<td className={styles.td}>{el.obj_name}</td>
										<td
											className={cn(styles.td, styles.td_filtered)}
											onClick={() => handleClickToSort('obj_type', el.obj_type)}
										>
											{el.obj_type}
										</td>
										<td className={styles.td}>{el.change_type}</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
		);
	}, [items]);

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

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{checkboxes}
		</section>
	);
}
