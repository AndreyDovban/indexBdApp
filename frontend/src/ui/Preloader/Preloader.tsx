import styles from './Preloader.module.css';
import type { HTMLAttributes, DetailedHTMLProps } from 'react';
import cn from 'classnames';

interface LoaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	className?: string;
}

export function Preloader({ className, ...props }: LoaderProps) {
	return <div className={cn(className, styles.loader)} {...props}></div>;
}
