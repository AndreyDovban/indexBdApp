'use client';
import styles from './Dropdown.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';
import type { MouseEvent } from 'react';
import ArrowCorner from '@/assets/svg/arrow-corner.svg?react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	children: ReactNode;
	text: string;
	className?: string;
	id?: string;
}

export function Dropdown({ id, text, children, className, ...props }: Props) {
	function changeState(e: MouseEvent<HTMLButtonElement>) {
		if (e.currentTarget.classList.contains(styles.open)) {
			e.currentTarget.lastElementChild?.classList.remove(styles.open_children);
			e.currentTarget.classList.remove(styles.open);
		} else {
			e.currentTarget.lastElementChild?.classList.add(styles.open_children);
			e.currentTarget.classList.add(styles.open);
		}
	}

	return (
		<button
			tabIndex={props.disabled ? -1 : 0}
			onClick={changeState}
			className={cn(className, styles.dropdown, {
				[styles.disabled]: props.disabled,
			})}
			{...props}
		>
			<div className={styles.id}>{id}</div>
			<div className={styles.title}>{text}</div>
			<ArrowCorner className={styles.icon} />
			<div className={styles.children}>{children}</div>
		</button>
	);
}
