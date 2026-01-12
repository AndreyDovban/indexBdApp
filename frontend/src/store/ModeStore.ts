import { create } from 'zustand';

interface IModeStore {
	mode: 'pagination' | 'range';
	setMode: (th: 'pagination' | 'range') => void;
	toggleMode: () => void;
}

const initial = 'pagination';

export const useModeStore = create<IModeStore>(set => ({
	mode: initial,
	setMode: (newTheme: 'pagination' | 'range') =>
		set(() => {
			return { mode: newTheme };
		}),
	toggleMode: () =>
		set((state: IModeStore) => {
			const t = state.mode == 'pagination' ? 'range' : 'pagination';
			return { mode: t };
		}),
}));
