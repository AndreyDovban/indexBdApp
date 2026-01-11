import { Button } from '@/ui';
import styles from './CreateDataSection.module.css';
import { useState, type ChangeEvent, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { useRequest } from '@/hooks/useRequest';
import { Spinner, Input } from '@/ui';

interface CreateDataProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function CreateDataSection({ className, ...props }: CreateDataProps) {
	const [value, setValue] = useState('0');
	const { data, request, loading } = useRequest<string>('/api/data');

	const getData = () => {
		request({ method: 'POST', body: { num: value } });
	};

	// const getData = async (url: string) => {
	// 	try {
	// 		const response = await fetch(url);
	// 		const data = await response.json();
	// 		setOut(data.length);
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// };

	return (
		<section className={`${className} ${styles.create_data_section}`} {...props}>
			<h3 className={styles.title}>Создание данных</h3>

			<Button appearance="tertiary" onClick={getData} className={loading ? styles.loading_btn : ''}>
				{loading ? <Spinner className={styles.spinner} /> : 'Создать'}
			</Button>

			<Input
				type="number"
				value={value}
				onInput={(e: ChangeEvent<HTMLInputElement>) => setValue(e.currentTarget.value)}
			/>

			<div className={styles.out}>{loading ? '... ...' : data}</div>
		</section>
	);
}
