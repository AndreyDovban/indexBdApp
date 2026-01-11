import styles from './Main.module.css';
import type { DetailedHTMLProps, ReactNode, HTMLAttributes } from 'react';

interface MainProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	children: ReactNode;
}

export function Main({ children, ...props }: MainProps) {
	return (
		<main className={styles.main} {...props}>
			{children}
		</main>
	);
}
