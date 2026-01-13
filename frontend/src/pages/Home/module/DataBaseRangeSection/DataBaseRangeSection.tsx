import styles from './DataBaseRangeSection.module.css';
import {
	useCallback,
	useEffect,
	useMemo,
	type DetailedHTMLProps,
	type HTMLAttributes,
	useRef,
	type UIEvent,
} from 'react';
import { useGetRangeData } from '@/hooks';
import { Spinner } from '@/ui';
import SortUp from '@/assets/svg/sort-up.svg?react';
import SortDown from '@/assets/svg/sort-down.svg?react';
import Sort from '@/assets/svg/sort.svg?react';
import Close from '@/assets/svg/bun.svg?react';
import cn from 'classnames';

interface DataBaseProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function DataBaseRangeSection({ className, ...props }: DataBaseProps) {
	const { data, request, loading } = useGetRangeData();
	const tableRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		request();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const changeSort = useCallback(
		(column: string) => {
			if (data) {
				request({
					...data.options,
					count: data.options.count,
					sortBy: column,
					direction: data.options.direction == 'next' ? 'prev' : 'next',
				});
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[request],
	);

	const handlerScroll = (e: UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;

		if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
			if (data) {
				target.scrollTop = 1;
				request({
					...data.options,
					offset: 0,
					startKey: data.options.startKey,
					invert: false,
					old_result: data.users.length ? data.users : null,
				});
			}
		}
		if (target.scrollTop == 0) {
			if (data) {
				target.scrollTop = target.scrollHeight - target.clientHeight - 1;
				request({
					...data.options,
					offset: 0,
					startKey: data.options.startKey,
					invert: true,
					old_result: data.users.length ? data.users : null,
				});
			}
		}
	};

	const hadlerFilterToClick = (filters: Record<'change_type', string>) => {
		if (data) {
			request({
				...data.options,
				offset: 0,
				startKey: data.options.startKey,
				filters,
				invert: false,
				old_result: null,
			});
		}
	};

	const handleClearFilters = () => {
		if (data) {
			request({
				...data.options,
				offset: 0,
				startKey: data.options.startKey,
				filters: undefined,
				old_result: null,
			});
		}
	};

	const title = useMemo(() => {
		// console.log('render title');

		return (
			<h3 className={styles.title}>
				Работа с IndexDb Range{loading ? <Spinner className={styles.spinner} /> : ''}
			</h3>
		);
	}, [loading]);

	const buttonSort = (direction: string, targetSort: boolean, sortBy: string) => {
		if (targetSort) {
			return (
				<button className={cn(styles.sort_btn, styles.sort_active)} onClick={() => changeSort(sortBy)}>
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

	const buttonClearFilter = (filters: Record<string, string> | undefined) => {
		if (filters) {
			return (
				<button className={cn(styles.sort_btn)} onClick={handleClearFilters}>
					<Close />
				</button>
			);
		}
	};

	const table = useMemo(() => {
		// console.log('render table');
		return (
			<div className={styles.wrap} ref={tableRef} onScrollEnd={handlerScroll}>
				<table className={styles.table}>
					{data && (
						<thead className={styles.thead}>
							<tr>
								<th className={styles.th}>
									<div>
										<span>uid</span>
										<span className={styles.grow}></span>
										{buttonSort(
											data.options.direction,
											data.options.sortBy == 'obj_name',
											'obj_name',
										)}
										{buttonClearFilter(data.options.filters)}
									</div>
								</th>
								<th className={styles.th}>
									<div>
										<span>change_type</span>
										<span className={styles.grow}></span>
										{buttonSort(
											data.options.direction,
											data.options.sortBy == 'change_type',
											'change_type',
										)}
										{buttonClearFilter(data.options.filters)}
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
										<td
											className={cn(styles.td, styles.td_filtered)}
											onClick={() => hadlerFilterToClick({ change_type: el.change_type })}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const pagination = useMemo(() => {
		// console.log('render pagination', data?.options.count);

		return (
			<div className={styles.pagination}>
				<button className={styles.pagination_btn} onClick={() => changePage(true)}>
					<SortUp />
				</button>

				<button
					className={cn(styles.pagination_btn, styles.pagination_btn_down)}
					onClick={() => changePage(false)}
				>
					<SortUp />
				</button>

				<div className={styles.grow}></div>

				<span> {data?.options.count}</span>
			</div>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	return (
		<section className={`${className} ${styles.data_base_section}`} {...props}>
			{title}

			{table}

			{pagination}
		</section>
	);
}
