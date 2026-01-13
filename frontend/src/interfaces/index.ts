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
	filters?: {
		change_type: string;
	};
	startKey?: string | null;
	invert?: boolean;
	old_result?: IUser[] | null;
}

export interface IData {
	users: IUser[];
	options: IOptions;
}
