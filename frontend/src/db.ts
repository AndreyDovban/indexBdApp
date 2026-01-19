// db.ts
import { Dexie, type EntityTable } from 'dexie';

interface Objects {
	obj_name: string;
	obj_type: string;
	change_type: string;
}

const db = new Dexie('StreamDataDB') as Dexie & {
	objects: EntityTable<Objects, 'obj_name'>;
	selection: EntityTable<{ dn: string }, 'dn'>;
};

// Schema declaration:
db.version(1).stores({
	objects: 'obj_name, [obj_type+obj_name], [change_type+obj_name]',
	selection: 'dn',
});

export type { Objects };
export { db };
