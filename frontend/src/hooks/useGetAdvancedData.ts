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
				objectStore.createIndex('change_type', ['change_type', 'obj_name'], { unique: false });
			}
		};
	});
};

export function useGetAdvancedData() {
	const [data, setData] = useState<IData>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const request = async (config?: IOptions) => {
		const { sortBy = 'obj_name', direction = 'next', limit = 20, offset = 0, startKey = null } = config || {};

		try {
			setLoading(true);
			setError(null);

			// Закрываем предыдущее соединение, если оно осталось от прошлого запроса
			if (dbInstance) {
				dbInstance.close();
				dbInstance = null;
			}

			//  Открытие базы
			dbInstance = await openDB();
			const db = dbInstance;

			// 2. Открываем транзакцию на чтение
			const transaction = db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);

			const promises: [Promise<IUser[]>, Promise<number>] = [
				new Promise<IUser[]>((resolve, reject) => {
					const results: IUser[] = [];

					// Если sortBy совпадает с keyPath (obj_name), используем store.
					// Иначе используем индекс.
					const source = sortBy === 'obj_name' ? store : store.index(sortBy);

					let range: IDBKeyRange | null = null;
					if (startKey) {
						range = direction.includes('next')
							? IDBKeyRange.lowerBound(startKey, true) // Больше чем startKey
							: IDBKeyRange.upperBound(startKey, true); // Меньше чем startKey
					}
					let hasAdvanced = false;

					// Второе значение в openCursor — это направление ('next', 'prev', 'nextunique', 'prevunique')
					const cursorRequest = source.openCursor(range, direction);

					cursorRequest.onsuccess = event => {
						const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

						if (!cursor) {
							resolve(results);
							return;
						}

						// Вместо advance(offset) используем ручной пропуск в итерациях
						if (offset > 0 && !hasAdvanced) {
							hasAdvanced = true;
							cursor.advance(offset);
							return;
						}

						if (results.length < limit) {
							results.push(cursor.value);
							cursor.continue();
						} else {
							resolve(results);
						}
					};

					cursorRequest.onerror = () => reject(cursorRequest.error);
				}),

				cachedTotal !== null
					? Promise.resolve(cachedTotal)
					: new Promise(resolve => {
							const countReq = store.count();
							countReq.onsuccess = () => {
								cachedTotal = countReq.result;
								resolve(countReq.result);
							};
							// В случае ошибки count не блокируем загрузку данных
							countReq.onerror = () => resolve(0);
					  }),
			];

			const [resultData, total] = await Promise.all(promises);

			setData({
				users: resultData,
				options: {
					count: total,
					sortBy,
					direction,
					limit,
					offset,
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
