import { db, type Objects } from '@/db';
import styles from './DataBaseDexieSection.module.css';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type DetailedHTMLProps,
	type HTMLAttributes,
} from 'react';
import { CheckBox, Spinner } from '@/ui';
import cn from 'classnames';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import Sort from '@/assets/svg/sort.svg?react';
import Clear from '@/assets/svg/close.svg?react';
import Bun from '@/assets/svg/bun.svg?react';
import debounce from 'lodash/debounce';
import { TableVirtuoso, type TableVirtuosoHandle } from 'react-virtuoso';
import { choosedObjectsMapStore, diffObjectsMapStore } from '@/store';

interface DataBaseDexieProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

// Интерфейс для активных фильтров
interface IFilters {
	obj_type?: string;
	change_type: string[];
	applied_search?: string;
}

// Интерфейс состояния таблицы
interface ITableState {
	filters: IFilters;
	direction: 'next' | 'prev';
	sortBy?: string;
	search_term?: string;
}

// Интерфейс объекта для отображения в таблице
interface IObjectForRow {
	obj_name: string;
	obj_type: string;
	change_type: string;
	lv: number;
}

// Компонент секция отрисовки данных indexDB
export function DataBaseDexieSection({ className, ...props }: DataBaseDexieProps) {
	const { choosedObjectsMap, setChoosedObjectsMap } = choosedObjectsMapStore(); // Состояния атома -  Map выбранных облегченных объектов для быстрого поиска
	const { diffObjectsMap } = diffObjectsMapStore(); // Значение атома состояния - map облегчённых объектов с изменеиями
	const [, setTargetObjecDiff] = useState<Objects>({ obj_name: '', obj_type: '', change_type: '' }); //  Функция изменения состояния объект с информацией об изменённых атрибутах выбранного для просмотра объекта

	const [chooseAllByType, setChooseAllByType] = useState(false); // Внутреннее состояние компонента выбрать/отменить все объекты выбранных для показа типов
	const [targetObjectName, setTargetObjectName] = useState('');
	const [listNamesParents, setListNamesParents] = useState(new Set()); // Внутреннее состояние компонента массив "dn" удалённых/перемещённых контейнеров для автоматического добавления в список объектов для восстановления

	/* Внутреннее состояние компонента - состояние фильтрации и сортироваки таблицы */
	const [state, setState] = useState<ITableState>({
		filters: {
			change_type: ['changed', 'removed', 'moved'],
			applied_search: '',
		},
		direction: 'next',
		search_term: '',
	});

	/* Мемоизированные данные для отрисовки в таблице с виртулизацией */
	const displayData = useMemo(() => {
		// 1. Быстрая проверка на пустые данные
		if (!diffObjectsMap || diffObjectsMap.size === 0) return [];

		const { change_type, obj_type, applied_search } = state.filters; // Состояние фильтрации
		const { sortBy, direction } = state; // Состояние сортировки

		const result: IObjectForRow[] = []; // Итоговый массив данных
		const query = applied_search?.toLowerCase(); // Строка для поиска по вхождению

		// 2. Единый цикл фильтрации (самый быстрый способ в JS 2026)
		for (const [obj_name, params] of diffObjectsMap) {
			// Фильтр по типу изменения
			if (change_type.length < 3 && !change_type.includes(params.change_type)) continue;

			// Фильтр по типу объекта
			if (obj_type && params.obj_type !== obj_type) continue;

			// Поиск по имени (UID)
			if (query && !obj_name.toLowerCase().includes(query)) continue;

			// Добавляем в итоговый массив облегченный объект
			result.push({
				obj_name: obj_name,
				obj_type: params.obj_type,
				change_type: params.change_type,
				lv: params.lv,
			});
		}

		// 3. Сортировка
		result.sort((a: IObjectForRow, b: IObjectForRow) => {
			// Сортировка по имени всегда (как базовая или основная)
			if (sortBy === 'obj_name' || !sortBy) {
				return a.obj_name.localeCompare(b.obj_name);
			}

			// Сортировка по типу или изменению
			const valA = a[sortBy] || '';
			const valB = b[sortBy] || '';

			// Если значения одинаковые, сортируем по имени для стабильности списка
			return valA.localeCompare(valB) || a.obj_name.localeCompare(b.obj_name);
		});

		// 4. Направление
		if (direction === 'prev') {
			result.reverse();
		}

		if (chooseAllByType) {
			const objects = changeExistMovedParent(result);
			setChoosedObjectsMap(objects);
		} else {
			setChoosedObjectsMap(new Map());
			setListNamesParents(new Set([]));
		}

		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		diffObjectsMap,
		state.direction,
		state.filters.applied_search,
		state.filters.change_type,
		state.filters.obj_type,
		state.sortBy,
		chooseAllByType,
		setChoosedObjectsMap,
	]);
	console.log(diffObjectsMap.size);

	/* Функция которая обновляет только примененный фильтр */
	const debouncedApplySearch = useMemo(
		() =>
			debounce(value => {
				setState(prev => ({
					...prev,
					filters: { ...prev.filters, applied_search: value },
				}));
			}, 500),
		[],
	);

	/* Обработчик изменения в инпуте */
	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// Мгновенно обновляем search_term для плавности печати
		setState(prev => ({ ...prev, search_term: value }));

		// Откладываем обновление тяжелого фильтра
		debouncedApplySearch(value);
	};

	/* Обработчик выбора объекта для отображения в таблице с изменёнными атрибутами */
	async function handleChoose(path: string) {
		const obj = await db.objects.get(path);

		// console.log(obj);
	}

	/* Функция включения в список на восстановление удалённых(перемещённых) контейнеров имеющих дочерние компоненты в списке на восстановление */
	function changeExistMovedParent(list: IObjectForRow[]) {
		const choosedObjects = new Map();
		for (const el of list) {
			const params = { change_type: el.change_type, lv: el.lv, obj_type: el.obj_type };

			choosedObjects.set(el.obj_name, params);
		}

		return choosedObjects;
	}

	/* Функция добавления и удаления всех отображённых объектов в массив объектов для восстановления */
	const handleAddAllObjects = () => setChooseAllByType(prev => !prev);

	/* Функция добавления/удаления одного объекта из сета выбранных объектов */
	const handleChooseObject = (obj: Objects) => {
		let arr = [];

		if (choosedObjectsMap.has(obj.obj_name)) {
			arr = Array.from(choosedObjectsMap).map(([key, value]) => ({ obj_name: key, ...value }));
		} else {
			arr = [...Array.from(choosedObjectsMap).map(([key, value]) => ({ obj_name: key, ...value })), obj];
		}

		const objects = changeExistMovedParent(arr);
		setChoosedObjectsMap(objects);
	};

	/* Функция изменения сортировки */
	const changeSort = (sortBy: string) => {
		setState(prev => {
			const next = { ...prev };
			next.sortBy = sortBy;
			next.direction = next.direction == 'next' ? 'prev' : 'next';
			return next;
		});
	};

	/* Функция сброса фильтра по выбранному полю */
	const handleClearFilters = (field: keyof IFilters) => {
		setState(prev => {
			const next = { ...prev };
			if (field in next.filters) {
				delete next['filters'][field];
			}

			return next;
		});
	};

	/* Функция задания фильтра кликом по полю яцейки тела таблици */
	const handleClickToFillter = (field: keyof IFilters, value: string) => {
		setState(prev => {
			const next = { ...prev };
			if (field != 'change_type') {
				next['filters'][field] = value;
			}
			return next;
		});
	};

	/* Функция задания фильтра выбором селект */
	const handleSelectFillter = (field: keyof IFilters, value: string) => {
		setState(prev => {
			const next = { ...prev };
			if (field != 'change_type') {
				next['filters'][field] = value;
			}
			return next;
		});
	};

	/* Функция изменения фильтра по полю change_type */
	const handleCheckboxChange = (type: keyof IFilters) => {
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
				<span>{choosedObjectsMap.size ?? 0}</span>
			</h3>
		);
	}, [choosedObjectsMap.size]); // Зависим от обоих состояний

	/* Виртуализированный компонент шапки таблицы для эффективного отображения больших табличных наборов данных */
	const FixedHeader = useCallback(
		() => (
			<tr>
				<th className={styles.th} key={1} title={'choose_all'}>
					<CheckBox className={styles.check} checked={chooseAllByType} onChange={handleAddAllObjects} />
				</th>

				<th className={cn(styles.th)} key={2}>
					<div>
						<span>objects</span>
						<span className={styles.grow}></span>
						<div className={styles.thblocksecond}>
							<input className={styles.input} value={state.search_term} onChange={handleSearchChange} />
							{state.sortBy == 'obj_name' ? (
								state.direction == 'next' ? (
									<button
										className={cn(styles.sort_btn, styles.active)}
										onClick={() => changeSort('obj_name')}
									>
										<SortUp />
									</button>
								) : (
									<button
										className={cn(styles.sort_btn, styles.active)}
										onClick={() => changeSort('obj_name')}
									>
										<SortDown />
									</button>
								)
							) : (
								<button className={cn(styles.sort_btn)} onClick={() => changeSort('obj_name')}>
									<Sort />
								</button>
							)}
							{state.filters.applied_search && (
								<button
									className={cn(styles.sort_btn, {
										[styles.hide]: !('obj_name' in state.filters),
									})}
								>
									<Clear
										onClick={() => {
											setState(prev => {
												const next = { ...prev };
												next.filters.applied_search = '';
												next.search_term = '';
												return next;
											});
										}}
									/>
								</button>
							)}
							{state.filters.applied_search && (
								<button
									className={cn(styles.sort_btn, styles.active)}
									onClick={() => {
										setState(prev => {
											const next = { ...prev };
											next.filters.applied_search = '';
											next.search_term = '';
											return next;
										});
									}}
								>
									<Bun />
								</button>
							)}
						</div>
					</div>
				</th>

				<th className={cn(styles.th)} key={3}>
					<div className={styles.thblock}>
						<div className={styles.thblockfirst}>class</div>
						<div className={styles.thblocksecond}>
							<select
								className={styles.select}
								onChange={e => handleSelectFillter('obj_type', e.target.value)}
								value={state.filters.obj_type ? state.filters.obj_type : ''}
							>
								<option className={styles.option} value=""></option>
								<option className={styles.option} value="user">
									user
								</option>
								<option className={styles.option} value="group">
									group
								</option>
								<option className={styles.option} value="role">
									role
								</option>
								<option className={styles.option} value="privilege">
									privilege
								</option>
								<option className={styles.option} value="permission">
									permission
								</option>
								<option className={styles.option} value="group_policies">
									group_policies
								</option>
								<option className={styles.option} value="group_policy_templates">
									group_policy_templates
								</option>
								<option className={styles.option} value="container">
									container
								</option>
								<option className={styles.option} value="division">
									division
								</option>
								<option className={styles.option} value="dns_record">
									dns_record
								</option>
								<option className={styles.option} value="pwd_policies">
									pwd_policies
								</option>
								<option className={styles.option} value="untyped">
									untyped
								</option>
							</select>
							{state.sortBy == 'obj_type' ? (
								state.direction == 'next' ? (
									<button
										className={cn(styles.sort_btn, styles.active)}
										onClick={() => changeSort('obj_type')}
									>
										<SortUp />
									</button>
								) : (
									<button
										className={cn(styles.sort_btn, styles.active)}
										onClick={() => changeSort('obj_type')}
									>
										<SortDown />
									</button>
								)
							) : (
								<button className={cn(styles.sort_btn)} onClick={() => changeSort('obj_type')}>
									<Sort />
								</button>
							)}
							{state.filters.obj_type && (
								<button
									className={cn(styles.sort_btn, styles.active)}
									onClick={() => handleClearFilters('obj_type')}
								>
									<Bun />
								</button>
							)}
						</div>
					</div>
				</th>

				<th className={styles.th} key={4}></th>
			</tr>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[state, chooseAllByType],
	);

	/* Виртуализированный компонент тела таблицы для эффективного отображения больших табличных наборов данных */
	const TableComponents = useMemo(
		() => ({
			// Этот компонент отобразится, если пропс data пуст ([])
			EmptyPlaceholder: () => (
				<tbody>
					<tr>
						<td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
							not_found
						</td>
					</tr>
				</tbody>
			),

			TableRow: ({ ...props }) => {
				const index = props['data-index'];
				const rowData = displayData[index]; // Достаем данные по индексу

				// Проверяем подсветку "активного" объекта
				const isTarget = rowData?.obj_name === targetObjectName;

				return (
					<tr
						{...props}
						className={cn(props.className, {
							[styles.target_object]: isTarget, // Подсветка строки
						})}
					/>
				);
			},
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[targetObjectName],
	);

	/* Виртуализированный компонент таблицы для эффективного отображения больших табличных наборов данных */
	const table = useMemo(
		() => (
			<TableVirtuoso
				overscan={100}
				data={displayData}
				className={styles.table}
				components={TableComponents}
				fixedHeaderContent={FixedHeader}
				itemContent={(index, obj) => {
					return (
						<>
							<td className={styles.td}>
								<CheckBox
									className={styles.check}
									disabled={listNamesParents.has(obj.obj_name)}
									checked={choosedObjectsMap.has(obj.obj_name)}
									onChange={() => handleChooseObject(obj)}
								/>
							</td>
							<td className={styles.td} onClick={() => handleChoose(obj.obj_name)}>
								{obj.obj_name}
							</td>
							<td
								className={cn(styles.td, styles.td_filtered)}
								onClick={() => {
									handleChoose(obj.obj_name);
									handleClickToFillter('obj_type', obj.obj_type);
								}}
							>
								{obj.obj_type}
							</td>
							<td className={styles.td}>{obj.change_type}</td>
						</>
					);
				}}
			/>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[state, targetObjectName, handleChoose],
	);

	// Блок чекбоксов фильтрации по полю change_type
	const checkboxes = useMemo(() => {
		return (
			<div className={styles.checkboxes}>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('changed' as keyof IFilters)}
						checked={state.filters.change_type.includes('changed')}
					/>
					Изменённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('removed' as keyof IFilters)}
						checked={state.filters.change_type.includes('removed')}
					/>
					Удалённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('moved' as keyof IFilters)}
						checked={state.filters.change_type.includes('moved')}
					/>
					Перемещённые
				</label>
			</div>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [handleCheckboxChange]);

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{checkboxes}
		</section>
	);
}
