import styles from './HTag.module.css';
import cn from 'classnames';
import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

interface HTagProps extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
	tag: 'h1' | 'h2' | 'h3' | 'h4';
	className?: string;
	children: ReactNode;
}

export function Htag({ className, tag, children, ...props }: HTagProps) {
	switch (tag) {
		case 'h1':
			return (
				<h1 className={cn(className, styles.h1)} {...props}>
					{children}
				</h1>
			);
		case 'h2':
			return (
				<h2 className={cn(className, styles.h2)} {...props}>
					{children}
				</h2>
			);

		case 'h3':
			return (
				<h3 className={cn(className, styles.h3)} {...props}>
					{children}
				</h3>
			);

		case 'h4':
			return (
				<h4 className={cn(className, styles.h4)} {...props}>
					{children}
				</h4>
			);

		default:
			return null;
	}
}
