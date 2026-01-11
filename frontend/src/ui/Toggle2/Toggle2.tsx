import styles from './Toggle2.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	appearance: string;
	className?: string;
	children?: ReactNode;
	isActivate?: boolean;
	on: boolean;
}

export function Toggle2({ appearance, className, children, isActivate, on, ...props }: Props) {
	return (
		<button
			className={cn(className, styles.toggle2, {
				[styles.primary]: appearance == 'primary',
				[styles.secondary]: appearance == 'secondary',
				[styles.tertiary]: appearance == 'tertiary',
				[styles.quaternary]: appearance == 'quaternary',
				[styles.disabled]: props.disabled,
				[styles.on]: on,
				[styles.isActivate]: isActivate && on,
			})}
			{...props}
		>
			{children}
		</button>
	);
}
