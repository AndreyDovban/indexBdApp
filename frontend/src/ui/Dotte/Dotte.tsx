import styles from './Dotte.module.css';
import cn from 'classnames';
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	className?: string;
	ariaLabel: string;
}

export function Dotte({ ariaLabel, className, ...props }: Props) {
	return <button aria-label={ariaLabel} className={cn(className, styles.dotte)} {...props}></button>;
}
