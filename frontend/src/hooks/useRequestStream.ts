import { useState } from 'react';
import { db, type Objects } from '@/db'; // Импортируем экземпляр db из db.ts
import { JSONParser } from '@streamparser/json';
import { diffObjectsMapStore } from '@/store';
import { createParentsNames } from '@/helpers';

type IRequestConfig = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
};

type IHeaders = Record<string, string>;

export function useRequestStream<T>(url: string) {
	const [data, setData] = useState<T>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);
	const { diffObjectsMap, setDiffObjectsMap } = diffObjectsMapStore();

	let controller = new AbortController();

	const request = async (config?: IRequestConfig) => {
		const headers: IHeaders = { 'Content-Type': 'application/json' };

		try {
			setLoading(true);
			setError(null);
			controller.abort();
			controller = new AbortController();
			const signal = controller.signal;

			if (!db.isOpen()) await db.open();
			await db.objects.clear();

			const response = await fetch(url, {
				method: config?.method || 'GET',
				headers: headers,
				body: JSON.stringify(config?.body),
				signal,
			});

			if (!response || !response.body) return;

			const reader = response.body.getReader({ mode: 'byob' });
			const parser = new JSONParser({ keepStack: false });

			// Параметры пакетной записи
			const CHUNK_SIZE = 5000; // Оптимальный размер пачки для IndexedDB
			let objectsToStore: Objects[] = [];
			let totalProcessed = 0;

			// Цепочка промисов для записи, чтобы не забивать память параллельными записями
			let writePromise = Promise.resolve();

			// Функция для сохранения накопленных данных
			const flushAccumulator = () => {
				if (objectsToStore.length === 0) return;

				const data = [...objectsToStore];
				objectsToStore = [];

				const partialIndexUpdate = data.map(el => {
					return {
						obj_name: el.obj_name,
						params: {
							obj_type: el.obj_type,
							change_type: el.change_type,
							lv: createParentsNames(el.obj_name).length,
						},
					};
				});

				// Ставим запись в очередь
				writePromise = writePromise.then(() => db.objects.bulkAdd(data));

				if (partialIndexUpdate.length > 0) {
					const newMap = new Map();
					for (const item of partialIndexUpdate) {
						newMap.set(item.obj_name, item.params);
					}

					const next = diffObjectsMap;
					for (const [key, value] of newMap) {
						next.set(key, value);
					}

					setDiffObjectsMap(next);
				}
			};

			// Обработчик срабатывает для каждого завершенного узла (ключа, объекта или элемента массива)
			parser.onValue = ({ value, key, stack }) => {
				if (stack.length === 1 && key !== 'result') {
					// console.log(`${key} =`, value);
				}

				if (stack.length === 2 && stack[1]['key'] == 'result') {
					objectsToStore.push(value);
					totalProcessed++;

					if (objectsToStore.length >= CHUNK_SIZE) {
						flushAccumulator();
					}
				}
			};

			let buffer = new ArrayBuffer(1024 * 1024);

			// Читаем поток чанками
			while (true) {
				const { done, value } = await reader.read(new Uint8Array(buffer));
				if (done) break;

				parser.write(value);
				buffer = value.buffer;
			}

			// Сохраняем остатки после завершения потока
			flushAccumulator();
			await writePromise;

			setData(`${totalProcessed} объектов сохранено` as T);
			console.log('Импорт завершен:', totalProcessed);

			if (!response.ok) {
				const t = await response.text();
				if (!t) {
					throw new Error(`Ошибка HTTP запроса! Статус ошибки ${response.status}`);
				}
				throw new Error(t);
			}

			setData(`${totalProcessed} objects received` as T);
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
