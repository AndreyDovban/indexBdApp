import styles from './Toggle.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	appearance: string;
	className?: string;
	children?: ReactNode;
	on: boolean;
}

export function Toggle({ appearance, className, children, on, ...props }: Props) {
	return (
		<button
			className={cn(className, styles.toggle, {
				[styles.primary]: appearance == 'primary',
				[styles.secondary]: appearance == 'secondary',
				[styles.tertiary]: appearance == 'tertiary',
				[styles.quaternary]: appearance == 'quaternary',
				[styles.disabled]: props.disabled,
			})}
			{...props}
		>
			{children}
			<input tabIndex={-1} type="checkbox" aria-label="..." className={styles.checkbox} />
			<div
				className={cn(styles.elliple, {
					[styles.on]: on,
				})}
			></div>
		</button>
	);
}
