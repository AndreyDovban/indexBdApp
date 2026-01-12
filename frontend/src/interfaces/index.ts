export interface IUser {
	obj_name: string;
	change_type: string;
}

export interface IOptions {
	count: number;
	sortBy: 'obj_name' | 'change_type';
	direction: 'next' | 'prev';
	offset: number;
	limit: number;
	filter?: {
		field: string;
		value: unknown;
	};
	startKey?: string | null;
	invert?: boolean;
	old_result?: IUser[] | null;
}

export interface IData {
	users: IUser[];
	options: IOptions;
}
