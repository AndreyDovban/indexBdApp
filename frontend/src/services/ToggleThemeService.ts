import { useLayoutEffect } from 'react';
import { useThemeStore } from '@/store';

export function ToggleThemeService() {
	const { setTheme } = useThemeStore();

	useLayoutEffect(() => {
		if (localStorage.getItem('theme')) {
			const theme = localStorage.getItem('theme');
			if (theme == 'dark') {
				setTheme('dark');
			} else {
				setTheme('light');
			}
		}
	}, [setTheme]);

	return null;
}
