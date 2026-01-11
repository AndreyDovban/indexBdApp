'use client';
import styles from './Dropdown.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';
import { type MouseEvent, useRef } from 'react';
import ArrowCorner from '@/assets/svg/arrow-corner.svg?react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	children: ReactNode;
	text: string;
	className?: string;
	id?: string;
}

export function Dropdown({ id, text, children, className, ...props }: Props) {
	const container = useRef<HTMLDivElement | null>(null);

	function changeState(e: MouseEvent<HTMLButtonElement>) {
		e.currentTarget.classList.toggle(styles.open);
		if (container.current) {
			if (e.currentTarget.classList.contains(styles.open)) {
				container.current.style.maxHeight = container.current.scrollHeight + 'px';
				container.current.style.marginTop = '20px';
			} else {
				container.current.style.maxHeight = '0';
				container.current.style.marginTop = '0';
			}
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
			<div className={styles.children} ref={container}>
				{children}
			</div>
		</button>
	);
}
