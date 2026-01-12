import styles from './DataBaseRangeSection.module.css';
import { useCallback, useEffect, useMemo, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useGetRangeData } from '@/hooks';
import { Spinner } from '@/ui';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import cn from 'classnames';

interface DataBaseProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function DataBaseRangeSection({ className, ...props }: DataBaseProps) {
	const { data, request, loading } = useGetRangeData();

	useEffect(() => {
		request();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const changeSort = useCallback(
		(column: 'obj_name' | 'change_type') => {
			if (data) {
				request({
					...data.options,
					count: data.options.count,
					sortBy: column,
					direction: data.options.direction == 'next' ? 'prev' : 'next',
				});
			}
		},
		[request],
	);

	const changePage = useCallback(
		(invert: boolean) => {
			if (data) {
				request({
					...data.options,
					offset: 0,
					startKey: data.options.startKey,
					invert,
					old_result: data.users.length ? data.users : null,
				});
			}
		},
		[request],
	);

	const title = useMemo(() => {
		// console.log('render title');

		return (
			<h3 className={styles.title}>
				Работа с IndexDb Range{loading ? <Spinner className={styles.spinner} /> : ''}
			</h3>
		);
	}, [loading]);

	const table = useMemo(() => {
		// console.log('render table');
		return (
			<div className={styles.wrap}>
				<table className={styles.table}>
					{data && (
						<thead className={styles.thead}>
							<tr>
								<th className={styles.th} onClick={() => changeSort('obj_name')}>
									<div>
										<span>uid</span>
										{data.options.direction == 'next' ? (
											<SortUp
												className={cn(styles.icon, {
													[styles.sort_active]: data.options.sortBy == 'obj_name',
												})}
											/>
										) : (
											<SortDown
												className={cn(styles.icon, {
													[styles.sort_active]: data.options.sortBy == 'obj_name',
												})}
											/>
										)}
									</div>
								</th>
								<th className={styles.th} onClick={() => changeSort('change_type')}>
									<div>
										<span>change_type</span>
										{data.options.direction == 'next' ? (
											<SortUp
												className={cn(styles.icon, {
													[styles.sort_active]: data.options.sortBy == 'change_type',
												})}
											/>
										) : (
											<SortDown
												className={cn(styles.icon, {
													[styles.sort_active]: data.options.sortBy == 'change_type',
												})}
											/>
										)}
									</div>
								</th>
							</tr>
						</thead>
					)}

					<tbody className={styles.tbody}>
						{data &&
							data.users.map(el => {
								return (
									<tr key={el.obj_name} className={styles.tr}>
										<td className={styles.td}>{el.obj_name}</td>
										<td className={styles.td}>{el.change_type}</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
		);
	}, [data]);

	const pagination = useMemo(() => {
		// console.log('render pagination', data?.options.count);

		return (
			<div className={styles.pagination}>
				<button className={styles.pagination_btn} onClick={() => changePage(true)}>
					prev
				</button>

				<button className={styles.pagination_btn} onClick={() => changePage(false)}>
					next
				</button>

				<hr />
				<span> {data?.options.count}</span>
			</div>
		);
	}, [data]);

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{pagination}
		</section>
	);
}
