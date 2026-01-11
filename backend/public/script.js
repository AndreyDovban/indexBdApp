const getDate = async () => {
	try {
		console.log('work');
		const res = await fetch('/data');
		// const text = await res.json();

		// console.log(text.length);

		const reader = res.body.getReader({ mode: 'byob' });
		const decoder = new TextDecoder();
		let resultJSON = '';

		try {
			while (true) {
				// Создаем буфер (например, 64 КБ)
				const buffer = new ArrayBuffer(65536);

				// Читаем данные прямо в наш буфер
				const { done, value } = await reader.read(new Uint8Array(buffer));

				if (done) break;

				// Декодируем чанк и добавляем к строке
				// { stream: true } важен, чтобы правильно обрабатывать символы на стыке чанков
				resultJSON += decoder.decode(value, { stream: true });
			}

			// Завершаем декодирование и парсим финальную строку
			resultJSON += decoder.decode();
			const products = JSON.parse(resultJSON);
			console.log('Загружено:', products.length);
			return products;
		} catch (error) {
			console.error('Ошибка при чтении потока:', error);
		} finally {
			reader.releaseLock();
		}
	} catch (error) {
		console.log(error);
	}
};

const btn = document.getElementById('btn');

btn.onclick = getDate;
