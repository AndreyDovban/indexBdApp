import styles from './Header.module.css';
import cn from 'classnames';
import { type DetailedHTMLProps, type HTMLAttributes } from 'react';
import logo from '@/assets/images/logo-universal.png';
import { ThemeSwitcher } from '..';

interface HeaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function Header({ className, ...props }: HeaderProps) {
	return (
		<header className={cn(className, styles.header)} {...props}>
			<div className={styles.logo_wrap}>
				<img className={styles.logo} src={logo} id="logo" alt="logo" />
				<h1 className={styles.title}>INDEX BD</h1>
			</div>

			<ThemeSwitcher />
		</header>
	);
}
