import { useState } from 'react';
import Dexie, { type Table } from 'dexie';

// Интерфейс объекта
interface IStreamObject {
	obj_name: string;
	obj_type: string;
	change_type: string;
	[key: string]: unknown;
}

// Класс базы данных Dexie
class StreamDatabase extends Dexie {
	objects!: Table<IStreamObject>;

	constructor() {
		super('StreamDataDB');
		this.version(1).stores({
			// Индексы: первичный ключ и составные индексы для фильтрации/сортировки
			objects: 'obj_name, [obj_type+obj_name], [change_type+obj_name]',
		});
	}
}

type IRequestConfig = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
};

type IHeaders = Record<string, string>;

let dbInstance: IDBDatabase | null = null;

export function useRequestDexieStream<T>(url: string) {
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

			// Закрываем предыдущее соединение, если оно осталось от прошлого запроса
			if (dbInstance) {
				dbInstance.close();
				dbInstance = null;
			}

			// 1. Полное удаление старой базы данных перед созданием новой
			// Dexie.delete('имя') корректно закрывает все соединения
			await Dexie.delete('StreamDataDB');

			// 2. Инициализация нового экземпляра БД
			const db = new StreamDatabase();
			await db.open();

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
					leftover = lines.pop() || '';

					const objectsToInsert: IStreamObject[] = [];

					for (const line of lines) {
						if (line.trim()) {
							const str = '{' + line + '}}';
							try {
								const obj = JSON.parse(str);
								objectsToInsert.push(obj);
								count++;
							} catch (e) {
								console.error('Ошибка парсинга строки:', e, '\n', line);
							}
						}
					}

					// 3. Пакетная вставка через Dexie bulkAdd (быстрее чем по одному)
					if (objectsToInsert.length > 0) {
						await db.objects.bulkAdd(objectsToInsert);
					}

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
