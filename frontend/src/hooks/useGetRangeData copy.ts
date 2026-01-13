import { useState } from 'react';
import type { IData, IUser, IOptions } from '@/interfaces';

// Настройки БД
const DB_NAME = 'StreamDataDB';
const STORE_NAME = 'objects';
const DB_VERSION = 1;

let cachedTotal: number | null = null;
let dbInstance: IDBDatabase | null = null;

// Вспомогательная функция для открытия БД
const openDB = async (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
			const target = e.target as IDBOpenDBRequest;
			const db: IDBDatabase = target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'obj_name' });
				objectStore.createIndex('change_type', 'change_type', { unique: false });
				objectStore.createIndex('change_type', ['change_type', 'obj_name'], { unique: false });
			}
		};
	});
};

export function useGetRangeData() {
	const [data, setData] = useState<IData>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const request = async (config?: IOptions) => {
		const {
			sortBy = 'obj_name',
			direction = 'next',
			limit = 10,
			invert = false,
			old_result = null,
			offset = 0,
		} = config || {};

		try {
			setLoading(true);
			setError(null);

			// Закрываем предыдущее соединение, если оно осталось от прошлого запроса
			if (dbInstance) {
				dbInstance.close();
				dbInstance = null;
			}

			dbInstance = await openDB();
			const db = dbInstance;

			const transaction = db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);

			const fetchBatch = (old: IUser[] | null, inv: boolean): Promise<IUser[]> => {
				return new Promise<IUser[]>((resolve, reject) => {
					const results: IUser[] = [];

					// Если sortBy совпадает с keyPath (obj_name), используем store.
					// Иначе используем индекс.
					const isPrimary = sortBy === 'obj_name';
					const source = isPrimary ? store : store.index('change_type');

					let range: IDBKeyRange | null = null;
					let actualDirection = direction;
					if (inv) {
						actualDirection = direction.includes('next') ? 'prev' : 'next';
					}
					if (old && old.length) {
						const pivot = inv ? old[0] : old[old.length - 1];
						const pivotKey = isPrimary ? pivot.obj_name : [pivot.change_type, pivot.obj_name];
						if (inv) {
							range = direction.includes('next')
								? IDBKeyRange.upperBound(pivotKey, true) // Больше чем startKey
								: IDBKeyRange.lowerBound(pivotKey, true); // Меньше чем startKey
						} else {
							range = direction.includes('next')
								? IDBKeyRange.lowerBound(pivotKey, true) // Больше чем startKey
								: IDBKeyRange.upperBound(pivotKey, true); // Меньше чем startKey
						}
					}

					// Второе значение в openCursor — это направление ('next', 'prev', 'nextunique', 'prevunique')
					const cursorRequest = source.openCursor(range, actualDirection);

					cursorRequest.onsuccess = event => {
						const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

						if (cursor && results.length < limit) {
							results.push(cursor.value);
							cursor.continue();
						} else {
							resolve(results);
						}
					};

					cursorRequest.onerror = () => reject(cursorRequest.error);
				});
			};

			let resultData = await fetchBatch(old_result, invert);

			// if (resultData.length === 0 && old_result !== null) {
			// 	resultData = await fetchBatch(null, invert);
			// }

			if (resultData.length === 0 && old_result !== null) {
				if (invert) {
					resultData = old_result.reverse();
				} else {
					resultData = old_result;
				}
			}

			if (cachedTotal == null) {
				const countReq = store.count();
				cachedTotal = await new Promise(res => {
					countReq.onsuccess = () => res(countReq.result);
					countReq.onerror = () => res(0);
				});
			}

			setData({
				users: invert ? resultData.reverse() : resultData,
				options: {
					count: cachedTotal || 0,
					sortBy,
					direction,
					offset,
					limit,
					invert,
				},
			});

			// Закрытие транзакции и базы
			transaction.oncomplete = () => {
				db.close();
				dbInstance = null;
			};
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				setError(error);
			}
		} finally {
			setLoading(false);
		}
	};

	return { data, loading, error, request };
}
