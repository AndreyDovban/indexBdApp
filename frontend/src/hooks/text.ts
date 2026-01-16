import { JSONParser } from '@streamparser/json';
import Dexie from 'dexie';

// 1. Настройка базы данных Dexie
const db = new Dexie('HugeDataDB');
db.version(1).stores({
	results: '++id', // Индексируем только автоинкрементный ID для скорости
});

async function processAndStoreLargeJson(url) {
	const response = await fetch(url);
	if (!response.body) return;

	const reader = response.body.getReader({ mode: 'byob' });
	const parser = new JSONParser();

	// Параметры пакетной записи
	const CHUNK_SIZE = 1000; // Оптимальный размер пачки для IndexedDB
	let accumulator = [];
	let writePromise = Promise.resolve();

	// Функция для сохранения накопленных данных
	const flushAccumulator = async () => {
		if (accumulator.length === 0) return;
		const dataToSave = [...accumulator];
		accumulator = [];

		// Ждем завершения предыдущей записи, чтобы не забивать очередь микрозадач
		await writePromise;
		writePromise = db.results.bulkAdd(dataToSave).catch(err => {
			console.error('Ошибка bulkAdd:', err);
		});
	};

	parser.onValue = ({ value, key, stack }) => {
		// А) Мета-данные первого уровня (не "result")
		if (stack.length === 1 && key !== 'result') {
			console.log(`Мета-ключ: ${key} =`, value);
		}

		// Б) Объекты внутри массива "result"
		if (stack.length === 2 && stack[0]?.key === 'result') {
			accumulator.push(value);

			if (accumulator.length >= CHUNK_SIZE) {
				// Мы не используем await прямо здесь, чтобы не блокировать парсинг чанка,
				// но управляем очередью через writePromise
				flushAccumulator();
			}
		}
	};

	// 2. Цикл чтения BYOB
	const bufferSize = 128 * 1024; // 128KB
	let buffer = new ArrayBuffer(bufferSize);

	try {
		while (true) {
			const { done, value } = await reader.read(new Uint8Array(buffer, 0, bufferSize));
			if (done) break;

			parser.write(value);
			buffer = value.buffer; // Возвращаем буфер в цикл
		}

		// Сохраняем остатки после завершения потока
		await flushAccumulator();
		await writePromise;
		console.log('Импорт 1ГБ+ данных в IndexedDB успешно завершен');
	} catch (error) {
		console.error('Критическая ошибка:', error);
	} finally {
		reader.releaseLock();
	}
}

processAndStoreLargeJson('https://api.example.com/massive-export.json');
