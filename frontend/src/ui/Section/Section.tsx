import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import styles from './Section.module.css';
import cn from 'classnames';

interface T extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	children: ReactNode;
	className?: string;
}

/** Компонент секция*/
export function Section({ children, className, ...props }: T) {
	return (
		<section className={cn(className, styles.section)} {...props}>
			{children}
		</section>
	);
}
