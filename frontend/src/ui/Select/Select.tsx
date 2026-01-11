import styles from './Select.module.css';
import { useState, type DetailedHTMLProps, type HTMLAttributes } from 'react';

interface SelectProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	name?: string;
	className?: string;
	options?: string[];
	open?: boolean;
	value?: string;
}

export function Select({ name, className, options, open, value, ...props }: SelectProps) {
	const [t, setT] = useState(value);

	return (
		<div
			onClick={e => {
				// e.stopPropagation();
				e.currentTarget.classList.toggle(styles.open);
			}}
			tabIndex={1}
			data-name={name}
			data-value={t}
			className={`${className} ${styles.select}`}
			{...props}
		>
			<div className={`${styles.content} ${styles.opne ? open : null}`}>
				{options?.map((el, i) => {
					return (
						<span
							onClick={() => setT(el)}
							className={`${styles.option} ${t == el ? styles.target : null}`}
							key={i}
						>
							{el}
						</span>
					);
				})}
			</div>
		</div>
	);
}
