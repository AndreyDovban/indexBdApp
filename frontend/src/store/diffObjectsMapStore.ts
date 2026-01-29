import { create } from 'zustand';

interface IDiffParams {
	obj_type: string;
	change_type: string;
	lv: number;
}

interface IDiffObjectsMapStore {
	diffObjectsMap: Map<string, IDiffParams>;
	setDiffObjectsMap: (newMap: Map<string, IDiffParams>) => void;
}

export const diffObjectsMapStore = create<IDiffObjectsMapStore>(set => ({
	diffObjectsMap: new Map<string, IDiffParams>(),
	setDiffObjectsMap: newMap =>
		set(() => {
			return { diffObjectsMap: newMap };
		}),
}));
