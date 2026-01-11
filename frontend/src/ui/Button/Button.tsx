import styles from './Button.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	appearance: string;
	children: ReactNode;
	className?: string;
}

export function Button({ appearance, children, className, ...props }: Props) {
	return (
		<button
			tabIndex={props.disabled ? -1 : 0}
			className={cn(className, styles.button, {
				[styles.primary]: appearance == 'primary',
				[styles.secondary]: appearance == 'secondary',
				[styles.tertiary]: appearance == 'tertiary',
				[styles.disabled]: props.disabled,
			})}
			{...props}
		>
			{children}
		</button>
	);
}
