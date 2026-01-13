export interface IUser {
	obj_name: string;
	change_type: string;
	object_type: string;
}

export interface IOptions {
	count: number;
	filteredCount: number;
	sortBy: string;
	direction: 'next' | 'prev';
	offset: number;
	limit: number;
	filters?: Record<string, string>;
	startKey?: string | null;
	invert?: boolean;
	old_result?: IUser[] | null;
}

export interface IData {
	users: IUser[];
	options: IOptions;
}
