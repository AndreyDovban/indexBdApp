/**
 * Функция получения списка "dn" всех родителей целевого узла каталога
 * @module helpers/ createParentsNames
 */

/**
 * Функция получения списка "dn" всех родителей целевого узла каталога
 *
 * Получает все вышестоящие узлы аналогично структуре ldap каталога
 * @param {string} obj_name
 * @returns {string[]}
 */
export function createParentsNames(obj_name: string) {
	let arr = obj_name.split(',');
	let dc = '';
	arr = arr.filter(el => {
		if (/dc=/.test(el)) {
			dc += `${el},`;
			return false;
		} else {
			return true;
		}
	});
	dc = dc.substring(0, dc.length - 1);
	arr.push(dc);

	const result = [];

	for (let i = 1; i < arr.length; i++) {
		result.push(arr.slice(i).join(','));
	}

	return result;
}
