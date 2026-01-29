import { create } from 'zustand';

interface IChoosedObjectsMapStore {
	choosedObjectsMap: Map<unknown, unknown>;
	setChoosedObjectsMap: (th: Map<unknown, unknown>) => void;
}

const initial = new Map();

export const choosedObjectsMapStore = create<IChoosedObjectsMapStore>(set => ({
	choosedObjectsMap: initial,
	setChoosedObjectsMap: (th: Map<unknown, unknown>) =>
		set(() => {
			return { choosedObjectsMap: th };
		}),
}));
