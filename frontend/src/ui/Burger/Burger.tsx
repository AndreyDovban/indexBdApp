import styles from './Burger.module.css';
import cn from 'classnames';
import type { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	className?: string;
	isOpen?: boolean;
}

export function Burger({ className, isOpen = false, ...props }: Props) {
	return (
		<button
			aria-label="menu"
			className={cn(className, styles.burger, {
				[styles.open]: isOpen,
			})}
			{...props}
		>
			<div className={cn(styles.line, styles.l1)}></div>
			<div className={cn(styles.line, styles.l2)}></div>
			<div className={cn(styles.line, styles.l3)}></div>
		</button>
	);
}
