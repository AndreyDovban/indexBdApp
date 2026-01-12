import { useState } from 'react';

type IRequestConfig = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
};

type IHeaders = Record<string, string>;

// Настройки БД
const DB_NAME = 'StreamDataDB';
const STORE_NAME = 'objects';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function useRequestStream<T>(url: string) {
	const [data, setData] = useState<T>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	let controller = new AbortController();

	// Вспомогательная функция для открытия БД
	const openDB = async (): Promise<IDBDatabase> => {
		// 1. Сначала удаляем старую базу данных
		await new Promise((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
			deleteRequest.onsuccess = () => resolve(true);
			deleteRequest.onerror = () => reject(new Error('Не удалось удалить старую БД'));
			// Если база открыта в другой вкладке, удаление может быть заблокировано
			deleteRequest.onblocked = () => {
				console.warn('Удаление БД заблокировано. Закройте другие вкладки.');
				resolve(false);
			};
		});

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

	const request = async (config?: IRequestConfig) => {
		const headers: IHeaders = { 'Content-Type': 'application/json' };
		let total = 0;

		try {
			setLoading(true);
			setError(null);
			controller.abort();
			controller = new AbortController();
			const signal = controller.signal;

			// Закрываем предыдущее соединение, если оно осталось от прошлого запроса
			if (dbInstance) {
				dbInstance.close();
				dbInstance = null;
			}

			// Инициализируем новую пустую БД
			dbInstance = await openDB();
			const db = dbInstance;

			const response = await fetch(url, {
				method: config?.method || 'GET',
				headers: headers,
				body: JSON.stringify(config?.body),
				signal,
			});

			if (!response || !response.body) {
				return;
			}

			const reader = response.body.getReader({ mode: 'byob' });

			const decoder = new TextDecoder();

			let buffer = new ArrayBuffer(1024 * 1024); // Выделяем 64КБ под буфер
			let leftover: string | undefined = '';

			try {
				let count = 0;
				while (true) {
					// Передаем view нашего буфера в reader
					const { done, value } = await reader.read(new Uint8Array(buffer));

					if (done) break;

					// Декодируем только полученную часть данных
					const chunk = leftover + decoder.decode(value, { stream: true });

					const lines: string[] = chunk.split(/\[\{|\}\},\{|\}\}\]/);

					// Последний кусок может быть неполным JSON-объектом
					leftover = lines.pop();

					// 2. Открываем транзакцию на запись для текущей пачки объектов
					const transaction = db.transaction(STORE_NAME, 'readwrite');
					const store = transaction.objectStore(STORE_NAME);

					for (const line of lines) {
						if (line.trim()) {
							const str = '{' + line + '}}';
							try {
								const obj = JSON.parse(str);

								// 3. Записываем объект в IndexedDB
								store.add(obj);

								count++;
							} catch (e) {
								console.error('Ошибка парсинга строки:', e, '\n', line);
							}
						}
					}

					// Ждем завершения транзакции для этой порции (опционально, для надежности)
					await new Promise(res => {
						transaction.oncomplete = res;
						transaction.onerror = () => {
							console.error('Ошибка транзакции:', transaction.error);
							res(null);
						};
					});

					// Повторно используем тот же ArrayBuffer для следующего чтения
					buffer = value.buffer;
				}
				total = count;
			} finally {
				reader.releaseLock();
				db.close(); // Закрываем соединение после завершения
			}

			if (!response.ok) {
				const t = await response.text();
				if (!t) {
					throw new Error(`Ошибка HTTP запроса! Статус ошибки ${response.status}`);
				}
				throw new Error(t);
			}

			setData(`${total} objects received` as T);
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
