import { db } from '@/db';
import styles from './DataBaseDexieSection.module.css';
import { useMemo, useState, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Spinner } from '@/ui';
import Close from '@/assets/svg/bun.svg?react';
import cn from 'classnames';

interface DataBaseDexieProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

// Интерфейс для активных фильтров
interface IFilters {
	obj_type?: string;
	change_type?: string;
	search_name?: string;
}

export function DataBaseDexieSection({ className, ...props }: DataBaseDexieProps) {
	const [filters, setFilters] = useState<IFilters>({});
	const [loading, setLoading] = useState<boolean>(false);

	const result = useLiveQuery(async () => {
		setLoading(true);
		const { change_type, obj_type, search_name } = filters;

		// 1. Используем приоритетный фильтр через составной индекс
		// Это максимально сужает выборку на уровне движка БД (скорость O(log N))
		let collection = change_type
			? db.objects.where('[change_type+obj_name]').between([change_type, ''], [change_type, '\uffff'])
			: db.objects.toCollection();

		// 2. Добавляем фильтр на точное равенство obj_type
		if (obj_type) {
			collection = collection.and(item => item.obj_type === obj_type);
		}

		// 3. Добавляем фильтр на вхождение строки в obj_name (аналог SQL LIKE %str%)
		if (search_name) {
			const query = search_name.toLowerCase();
			collection = collection.and(item => item.obj_name.toLowerCase().includes(query));
		}

		// 3. Считаем общее количество подходящих записей (до применения limit)
		const filteredCount = await collection.count();

		// 4. Получаем сами данные с ограничением (пагинацией)
		const items = await collection.limit(50).toArray();
		setLoading(false);
		return {
			items,
			filteredCount,
		};
	}, [filters]);

	const { items = [], filteredCount = 0 } = result || {};

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

	const title = useMemo(() => {
		return (
			<h3 className={styles.title}>
				Работа с Dexie {items == undefined || loading ? <Spinner className={styles.spinner} /> : ''}
			</h3>
		);
	}, [items, loading]);

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
											className={styles.td}
											onClick={() => handleClickToSort('obj_type', el.obj_type)}
										>
											{el.obj_type}
										</td>
										<td
											className={styles.td}
											onClick={() => handleClickToSort('change_type', el.change_type)}
										>
											{el.change_type}
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
		);
	}, [filters, items]);

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{filteredCount}
		</section>
	);
}
