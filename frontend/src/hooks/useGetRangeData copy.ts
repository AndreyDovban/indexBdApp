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

export function useGetRangeData() {
	const [data, setData] = useState<IData>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const request = async (config?: IOptions) => {
		const {
			sortBy = 'obj_name',
			direction = 'next',
			limit = 3,
			invert = false,
			old_result = null,
			offset = 0,
			filters,
		} = config || {};

		try {
			setLoading(true);
			setError(null);

			// Закрываем предыдущее соединение, если оно осталось от прошлого запроса
			if (dbInstance) {
				dbInstance.close();
				dbInstance = null;
			}

			dbInstance = await openDB(); // Открытие соединения с базой
			const db = dbInstance;

			const transaction = db.transaction(STORE_NAME, 'readonly'); // Создание транзакции в режиме чтения
			const store = transaction.objectStore(STORE_NAME); //

			const fetchBatch = (old: IUser[] | null, inv: boolean): Promise<IUser[]> => {
				return new Promise<IUser[]>((resolve, reject) => {
					const results: IUser[] = []; // Итоговый результат, массив выбранных объетов
					const filterValue = filters?.change_type; // Значения фильтров

					let source; // Определение источника
					const isPrimary = sortBy === 'obj_name'; // Является ли выбранная для сортироваки колонка с первичным ключом
					// Если есть фильтр, ВСЕГДА используем составной индекс, так как он поддерживает и фильтр, и сортировку
					if (filterValue !== undefined) {
						source = store.index('change_type'); // индекс всегда ['change_type', 'obj_name']
					} else {
						source = isPrimary ? store : store.index('change_type'); //
					}

					let range: IDBKeyRange | null = null; // Диапазон для выбора значений

					let actualDirection = direction; // Актуалное направление скрола
					if (inv) {
						actualDirection = direction.includes('next') ? 'prev' : 'next'; // Инверси направления скрола в зависимости от перезанного параметра в запрос
					}

					// При заданных фильтрах
					if (filterValue) {
						// Если существует предыдущее значение
						if (old && old.length) {
							const pivot = inv ? old[0] : old[old.length - 1]; // Точка отсчета: берем первый элемент при инверсии (вверх) или последний (вниз)
							const pivotKey = [pivot.change_type, pivot.obj_name]; // Получение ключа отсчёта в зависимости выбранной колонки для сортировки

							if (actualDirection.includes('next')) {
								range = IDBKeyRange.bound(pivotKey, [filterValue, '\uffff'], true); // Идем от текущего элемента до конца диапазона этого фильтра
							} else {
								range = IDBKeyRange.bound([filterValue, ''], pivotKey, false, true); // Идем от начала диапазона фильтра до текущего элемента
							}
						} else {
							range = IDBKeyRange.bound([filterValue, ''], [filterValue, '\uffff']); // Первая страница с фильтром: строго в границах значения filterValue
						}
					} else {
						if (old && old.length) {
							const pivot = inv ? old[0] : old[old.length - 1]; // Получение объекта для отсчёта в зависимости от направления скрола
							const pivotKey = isPrimary ? pivot.obj_name : [pivot.change_type, pivot.obj_name]; // Получение ключа отсчёта в зависимости выбранной колонки для сортировки

							if (actualDirection.includes('next')) {
								range = IDBKeyRange.lowerBound(pivotKey, true); // Больше чем startKey
							} else {
								range = IDBKeyRange.upperBound(pivotKey, true); // Меньше чем startKey
							}
						}
					}

					const cursorRequest = source.openCursor(range, actualDirection); // Запрос к базе

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

			if (resultData.length === 0 && old_result !== null) {
				resultData = await fetchBatch(null, invert);
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
					filters,
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
