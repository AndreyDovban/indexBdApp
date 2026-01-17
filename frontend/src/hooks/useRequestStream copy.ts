import { useState } from 'react';
import { db, type Objects } from '@/db'; // Импортируем экземпляр db из db.ts
import Dexie from 'dexie';

type IRequestConfig = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
};

type IHeaders = Record<string, string>;

export function useRequestStream<T>(url: string) {
	const [data, setData] = useState<T>();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	let controller = new AbortController();

	const request = async (config?: IRequestConfig) => {
		const headers: IHeaders = { 'Content-Type': 'application/json' };
		let total = 0;

		try {
			setLoading(true);
			setError(null);
			controller.abort();
			controller = new AbortController();
			const signal = controller.signal;

			// 1. Очищаем старую базу данных перед началом нового стрима
			// Dexie.delete() полностью удаляет и пересоздает базу, гарантируя чистое состояние.
			await Dexie.delete('StreamDataDB');
			await db.open(); // Открываем соединение заново

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

			let buffer = new ArrayBuffer(1024 * 1024);
			let leftover: string | undefined = '';
			let objectsToStore: Objects[] = [];

			try {
				let count = 0;

				// 2. Используем одну большую транзакцию Dexie для всего процесса загрузки.
				// Это гарантирует атомарность: либо все объекты сохранятся, либо ни один.
				// Это также эффективно для useLiveQuery, который среагирует только один раз по завершении транзакции.
				await db.transaction('readwrite', db.objects, async () => {
					while (true) {
						// Передаем view нашего буфера в reader
						const { done, value } = await reader.read(new Uint8Array(buffer));

						if (done) break;

						// Декодируем только полученную часть данных
						const chunk = leftover + decoder.decode(value, { stream: true });

						const lines: string[] = chunk.split(/\[\{|\}\},\{|\}\}\]/);

						// Последний кусок может быть неполным JSON-объектом
						leftover = lines.pop();

						for (const line of lines) {
							if (line.trim()) {
								const str = '{' + line + '}}';
								try {
									// Предполагаем, что JSON.parse() вернет объект типа Objects
									const obj = JSON.parse(str);
									objectsToStore.push(obj);
									count++;
								} catch (e) {
									console.error('Ошибка парсинга строки:', e, '\n', line);
								}
							}
						}

						// Повторно используем тот же ArrayBuffer для следующего чтения
						buffer = value.buffer;
						if (objectsToStore.length >= 5000) {
							await db.objects.bulkAdd(objectsToStore);
							objectsToStore = [];
						}
					}

					// 3. Используем bulkAdd для эффективной массовой вставки всех собранных объектов
					if (objectsToStore.length > 0) {
						await db.objects.bulkAdd(objectsToStore);
					}
				});

				total = count;
			} finally {
				reader.releaseLock();
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
