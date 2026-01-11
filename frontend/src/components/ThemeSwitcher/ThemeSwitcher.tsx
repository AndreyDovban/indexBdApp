import styles from './ThemeSwitcher.module.css';
import { type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { Toggle2 } from '@/ui';
import { useThemeStore } from '@/store';
import Sun from '@/assets/svg/sun.svg?react';
import Moon from '@/assets/svg/moon.svg?react';
import cn from 'classnames';

interface ThemeSwitcherProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	className?: string;
}

export function ThemeSwitcher({ className, ...props }: ThemeSwitcherProps) {
	const { theme, toggleTheme } = useThemeStore();

	return (
		<div className={cn(className, styles.theme_switcher)} {...props}>
			<Toggle2
				appearance="quaternary"
				on={theme == 'dark'}
				onClick={toggleTheme}
				aria-label="изменение цветовой темы"
			>
				<Sun />
				<Moon />
			</Toggle2>
		</div>
	);
}
