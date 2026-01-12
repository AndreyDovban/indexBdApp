import styles from './Nav.module.css';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { Link } from 'react-router';

interface NavProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function Nav({ className, ...props }: NavProps) {
	return (
		<nav className={`${className} ${styles.nav}`} {...props}>
			<Link to={'/'}>Paginnation</Link>
			<Link to={'/range'}>Paginnation</Link>
		</nav>
	);
}
