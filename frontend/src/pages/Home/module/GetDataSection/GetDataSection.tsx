import { Button } from '@/ui';
import styles from './GetDataSection.module.css';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { useRequestStream } from '@/hooks';
import { Spinner } from '@/ui';

interface GetDataProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function GetDataSection({ className, ...props }: GetDataProps) {
	const { data, request, loading } = useRequestStream<string>('/api/data');

	const getData = () => {
		request();
	};

	return (
		<section className={`${className} ${styles.get_data_section}`} {...props}>
			<h3 className={styles.title}>Получение данных</h3>

			<Button appearance="tertiary" onClick={getData} className={loading ? styles.loading_btn : ''}>
				{loading ? <Spinner className={styles.spinner} /> : 'Получить'}
			</Button>

			<div className={styles.out}>{loading ? '... ...' : data}</div>
		</section>
	);
}
