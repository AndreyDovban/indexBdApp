import { db } from '@/db';
import styles from './DataBaseDexieSection.module.css';
import { useMemo, useState, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckBox, Spinner } from '@/ui';
import Close from '@/assets/svg/bun.svg?react';
import cn from 'classnames';

interface DataBaseDexieProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

// Интерфейс для активных фильтров
interface IFilters {
	obj_type?: string;
	change_type?: string | string[];
	search_name?: string;
}

export function DataBaseDexieSection({ className, ...props }: DataBaseDexieProps) {
	const [filters, setFilters] = useState<IFilters>({});
	const [loading, setLoading] = useState<boolean>(false);

	const result = useLiveQuery(async () => {
		setLoading(true);

		try {
			const { change_type, obj_type, search_name } = filters;

			// 1. Используется приоритетный фильтр через составной индекс
			// Это максимально сужает выборку на уровне движка БД (скорость O(log N))
			let collection = db.objects.toCollection();

			console.log(change_type);
			// 2. Подсчёт общего количества записей без фильтров
			const totalCount = await collection.count();

			//  Используем составной индекс [change_type+obj_name] для нескольких значений
			if (Array.isArray(change_type) && change_type.length > 0) {
				collection = db.objects.where('change_type').anyOf(change_type);
			} else {
				collection = db.objects.toCollection();
			}

			// 3. Добавляется фильтр на точное равенство obj_type
			if (obj_type) {
				collection = collection.and(item => item.obj_type === obj_type);
			}

			// 4. Добавляется фильтр на вхождение строки в obj_name (аналог SQL LIKE %str%)
			if (search_name) {
				const query = search_name.toLowerCase();
				collection = collection.and(item => item.obj_name.toLowerCase().includes(query));
			}

			// 5. Подсчёт общего количества подходящих записей (до применения limit)
			const filteredCount = await collection.count();

			// 6. Получение данныч с ограничением (пагинацией)
			const items = await collection.limit(50).toArray();

			return {
				items,
				filteredCount,
				totalCount,
			};
		} finally {
			setLoading(false);
		}
	}, [filters]);

	const { items = [], filteredCount = 0, totalCount = 0 } = result || {};

	const handleClickToSort = (field: keyof IFilters, value: string) => {
		setFilters((prev: IFilters) => {
			const next = { ...prev };
			next[field] = value;
			return next;
		});
	};

	const handleClearFilters = (field: keyof IFilters) => {
		setFilters((prev: IFilters) => {
			const next = { ...prev };
			if (field in next) {
				delete next[field];
			}
			return next;
		});
	};

	const handleCheckboxChange = (type: string) => {
		if (filters.change_type) {
			let change_type_arr = filters.change_type as string[];
			if (filters.change_type?.includes(type)) {
				change_type_arr = change_type_arr.filter(t => t !== type);
			} else {
				change_type_arr.push(type);
			}

			setFilters(prev => {
				return { ...prev, change_type: change_type_arr };
			});
		} else {
			setFilters(prev => {
				return { ...prev, change_type: [type] };
			});
		}
	};

	// const handleCheckboxChange = (type: string) => {
	// 	setFilters(prev => {
	// 		const current = prev.change_type || [];
	// 		const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
	// 		return { ...prev, change_type: next };
	// 	});
	// };

	const title = useMemo(() => {
		return (
			<h3 className={styles.title}>
				Работа с Dexie{' '}
				{items == undefined || loading ? (
					<Spinner className={styles.spinner} />
				) : (
					<span>
						{filteredCount} / {totalCount}
					</span>
				)}
			</h3>
		);
	}, [filteredCount, items, loading, totalCount]);

	const table = useMemo(() => {
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
										<button
											className={cn(styles.sort_btn, { [styles.hide]: !('obj_name' in filters) })}
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
										<button
											className={cn(styles.sort_btn, { [styles.hide]: !('obj_type' in filters) })}
											onClick={() => handleClearFilters('obj_type' as keyof IFilters)}
										>
											<Close />
										</button>
									</div>
								</th>

								<th className={styles.th}>
									<div>
										<span>change_type</span>
										<span className={styles.grow}></span>
										<button
											className={cn(styles.sort_btn, {
												[styles.hide]: !('change_type' in filters),
											})}
											onClick={() => handleClearFilters('change_type' as keyof IFilters)}
										>
											<Close />
										</button>
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
	}, [filters, items]);

	const checkboxes = useMemo(() => {
		return (
			<div className={styles.checkboxes}>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('changed')}
						checked={filters.change_type?.includes('changed')}
					/>
					Изменённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('deleted')}
						checked={filters.change_type?.includes('deleted')}
					/>
					Удалённые
				</label>
				<label>
					<CheckBox
						onChange={() => handleCheckboxChange('moved')}
						checked={filters.change_type?.includes('moved')}
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
