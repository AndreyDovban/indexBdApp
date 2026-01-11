import styles from './DataBaseSection.module.css';
import { useCallback, useEffect, useMemo, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useGetIndexDbData } from '@/hooks';
import { Spinner } from '@/ui';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import cn from 'classnames';

interface DataBaseProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function DataBaseSection({ className, ...props }: DataBaseProps) {
	const { data, request, loading } = useGetIndexDbData();

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
		(btn: string, i: number) => {
			if (data) {
				let t = 0;
				if (btn == 'num') {
					t = i * data.options.limit;
				} else if (btn == 'prev') {
					t = data.options.offset - data.options.limit;
					if (t < 0) {
						t = 0;
					}
				} else if (btn == 'next') {
					t = data.options.offset + data.options.limit;
					if (t >= data.options.count) {
						t = data.options.offset;
					}
				} else if (btn == 'first') {
					t = 0;
				} else if (btn == 'last') {
					t = data.options.count - (data.options.count % data.options.limit);
					if (t == data.options.count) {
						t = data.options.count - data.options.limit;
					}
				}

				if (t != data.options.offset) {
					request({
						...data.options,
						offset: t,
						startKey: null,
					});
				}
			}
		},
		[request],
	);

	const title = useMemo(() => {
		// console.log('render title');

		return (
			<h3 className={styles.title}>Работа с IndexDb{loading ? <Spinner className={styles.spinner} /> : ''}</h3>
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

		const out = [];
		if (data && data.options) {
			for (let i = 0; i < data.options.count / data.options.limit; i++) {
				if (
					(i >= data.options.offset / data.options.limit - 3 ||
						i >= data.options.count / data.options.limit - 7) &&
					(i < data.options.offset / data.options.limit + 4 || i < 7)
				) {
					out.push(
						<button
							key={i}
							className={cn(styles.pagination_btn, {
								[styles.pagination_btn_active]: i == data.options.offset / data.options.limit,
							})}
							onClick={() => changePage('num', i)}
						>
							{+i + 1}
						</button>,
					);
				}
			}
		}

		return (
			<div className={styles.pagination}>
				<button className={styles.pagination_btn} onClick={() => changePage('first', 0)}>
					first
				</button>
				<button className={styles.pagination_btn} onClick={() => changePage('prev', 0)}>
					prev
				</button>
				{out}

				<button className={styles.pagination_btn} onClick={() => changePage('next', 0)}>
					next
				</button>
				<button className={styles.pagination_btn} onClick={() => changePage('last', 0)}>
					last
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
