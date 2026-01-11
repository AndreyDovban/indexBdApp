import { create } from 'zustand';

interface IThemeStore {
	theme: 'dark' | 'light';
	setTheme: (th: 'dark' | 'light') => void;
	toggleTheme: () => void;
}

const initial = 'dark';

export const useThemeStore = create<IThemeStore>(set => ({
	theme: initial,
	setTheme: (newTheme: 'dark' | 'light') =>
		set(() => {
			document.body.setAttribute('data-theme', newTheme);
			return { theme: newTheme };
		}),
	toggleTheme: () =>
		set((state: IThemeStore) => {
			const t = state.theme == 'dark' ? 'light' : 'dark';
			if (t == 'dark') {
				document.body.setAttribute('data-theme', 'dark');
				localStorage.setItem('theme', 'dark');
			} else {
				document.body.setAttribute('data-theme', 'light');
				localStorage.setItem('theme', 'light');
			}
			return { theme: t };
		}),
}));
