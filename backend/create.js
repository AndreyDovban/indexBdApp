const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LITERALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const createData = async num => {
	const writeStream = createWriteStream('output.json');

	const change_types = ['changed', 'deleted', 'moved'];
	const object_types = ['person', 'group', 'container'];

	const len = num;

	let last =
		'"all_attributes":{"carLicense":{"backup_values":["AA827F"],"ldap_values":["AA683F"]},"cn":{"backup_values":["Максим Мартынов"],"ldap_values":["Максим Мартынов"]},"createTimestamp":{"backup_values":["20260107212313Z"],"ldap_values":["20260107212313Z"]},"creatorsName":{"backup_values":["uid=admin,cn=users,cn=accounts,dc=granulex,dc=test"],"ldap_values":["uid=admin,cn=users,cn=accounts,dc=granulex,dc=test"]},"departmentNumber":{"backup_values":["19"],"ldap_values":["13"]},"displayName":{"backup_values":["Максим Мартынов"],"ldap_values":["Максим Мартынов"]},"dsEntryDN":{"backup_values":["uid=test____mmartynov506304262,cn=users,cn=accounts,dc=granulex,dc=test"],"ldap_values":["uid=test____mmartynov506304262,cn=users,cn=accounts,dc=granulex,dc=test"]},"employeeNumber":{"backup_values":["13610"],"ldap_values":["76108"]},"entryUUID":{"backup_values":["f52fb1be-6886-4f22-8a0f-7d24a700bf66"],"ldap_values":["f52fb1be-6886-4f22-8a0f-7d24a700bf66"]},"entrydn":{"backup_values":["uid=test____mmartynov506304262,cn=users,cn=accounts,dc=granulex,dc=test"],"ldap_values":["uid=test____mmartynov506304262,cn=users,cn=accounts,dc=granulex,dc=test"]},"entryid":{"backup_values":["11826"],"ldap_values":["11826"]},"entryusn":{"backup_values":["429106"],"ldap_values":["429108"]},"facsimileTelephoneNumber":{"backup_values":["+1 415 827 8042"],"ldap_values":["+1 415 395 2392"]},"gecos":{"backup_values":["Максим Мартынов"],"ldap_values":["Максим Мартынов"]},"gidNumber":{"backup_values":["506304262"],"ldap_values":["506304262"]},"givenName":{"backup_values":["Максим"],"ldap_values":["Максим"]},"homeDirectory":{"backup_values":["/home/test____mmartynov506304262"],"ldap_values":["/home/test____mmartynov506304262"]},"initials":{"backup_values":["M M"],"ldap_values":["M M"]},"ipaUniqueID":{"backup_values":["133993fa-ec0f-11f0-99dc-bc24116c4445"],"ldap_values":["133993fa-ec0f-11f0-99dc-bc24116c4445"]},"krbExtraData":{"backup_values":["AALAzl5pcm9vdC9hZG1pbkBHUkFOVUxFWC5URVNUAA=="],"ldap_values":["AALAzl5pcm9vdC9hZG1pbkBHUkFOVUxFWC5URVNUAA=="]},"krbLastPwdChange":{"backup_values":["20260107212312Z"],"ldap_values":["20260107212312Z"]},"krbPasswordExpiration":{"backup_values":["20260107212312Z"],"ldap_values":["20260107212312Z"]},"krbPrincipalKey":{"backup_values":["MIHeoAMCAQGhAwIBAaIDAgEBowMCAQGkgccwgcQwaKAbMBmgAwIBBKESBBA3VVZKKl9KdjExU3UwR1lToUkwR6ADAgESoUAEPiAAMxKO9jSETkNrBAFbqq6aiQt/W0EE7O25i3rgM/eo6n7zJQGQl9P4qIYCbA+tIfLFxGgvI3T1v7iPBQtbMFigGzAZoAMCAQShEgQQOGY5XlZkODo+Iy9WJVExI6E5MDegAwIBEaEwBC4QAFNGqPb+EW8nNiFDisnia45kkqqIp+V7KHNmthD5cVHcVKffB3TeZ+MW7Ssy"],"ldap_values":["MIHeoAMCAQGhAwIBAaIDAgEBowMCAQGkgccwgcQwaKAbMBmgAwIBBKESBBA3VVZKKl9KdjExU3UwR1lToUkwR6ADAgESoUAEPiAAMxKO9jSETkNrBAFbqq6aiQt/W0EE7O25i3rgM/eo6n7zJQGQl9P4qIYCbA+tIfLFxGgvI3T1v7iPBQtbMFigGzAZoAMCAQShEgQQOGY5XlZkODo+Iy9WJVExI6E5MDegAwIBEaEwBC4QAFNGqPb+EW8nNiFDisnia45kkqqIp+V7KHNmthD5cVHcVKffB3TeZ+MW7Ssy"]},"krbPrincipalName":{"backup_values":["test____mmartynov506304262@GRANULEX.TEST"],"ldap_values":["test____mmartynov506304262@GRANULEX.TEST"]},"l":{"backup_values":["Краснодар"],"ldap_values":["Москва"]},"loginShell":{"backup_values":["/bin/bash"],"ldap_values":["/bin/bash"]},"mail":{"backup_values":["test____mmartynov506304262@example.com"],"ldap_values":["test____mmartynov506304262@example.com"]},"memberOf":{"backup_values":["cn=test____mmartyn_3q2kszytccbt85c,cn=users_history,cn=accounts,dc=granulex,dc=test"],"ldap_values":["cn=test____mmartyn_3q2kszytccbt85c,cn=users_history,cn=accounts,dc=granulex,dc=test"]},"mepManagedEntry":{"backup_values":["cn=test____mmartynov506304262,cn=groups,cn=accounts,dc=granulex,dc=test"],"ldap_values":["cn=test____mmartynov506304262,cn=groups,cn=accounts,dc=granulex,dc=test"]},"mobile":{"backup_values":["+1 818 502 333"],"ldap_values":["+1 818 315 5665"]},"modifiersName":{"backup_values":["cn=MemberOf Plugin,cn=plugins,cn=config"],"ldap_values":["uid=admin,cn=users,cn=accounts,dc=granulex,dc=test"]},"modifyTimestamp":{"backup_values":["20260107212314Z"],"ldap_values":["20260107212343Z"]},"nsAccountLock":{"backup_values":["FALSE"],"ldap_values":["FALSE"]},"nsUniqueId":{"backup_values":["ff92e681-ec0e11f0-97d29b71-0baacf5c"],"ldap_values":["ff92e681-ec0e11f0-97d29b71-0baacf5c"]},"objectClass":{"backup_values":["top","person","organizationalperson","inetorgperson","inetuser","posixaccount","krbprincipalaux","krbticketpolicyaux","ipaobject","ipasshuser","x-ald-user","x-ald-user-parsec14","x-ald-audit-policy","rbta-unit","rbta-address","rbtaCustomUserAttrs","rbta-inetorgperson-ext","ruPostMailAccount","rbtaUserMeta","ipauserauthtypeclass","ipaSshGroupOfPubKeys","mepOriginEntry"],"ldap_values":["top","person","organizationalperson","inetorgperson","inetuser","posixaccount","krbprincipalaux","krbticketpolicyaux","ipaobject","ipasshuser","x-ald-user","x-ald-user-parsec14","x-ald-audit-policy","rbta-unit","rbta-address","rbtaCustomUserAttrs","rbta-inetorgperson-ext","ruPostMailAccount","rbtaUserMeta","ipauserauthtypeclass","ipaSshGroupOfPubKeys","mepOriginEntry"]},"ou":{"backup_values":["Отдел информационного обеспечения"],"ldap_values":["Департамент новых технологий и услуг"]},"pager":{"backup_values":["+1 808 415 2870"],"ldap_values":["+1 808 205 1247"]},"parentid":{"backup_values":["3"],"ldap_values":["3"]},"postalCode":{"backup_values":["654233"],"ldap_values":["654435"]},"preferredLanguage":{"backup_values":["ru"],"ldap_values":["en"]},"proxyAddresses":{"backup_values":["SMTP:TEST____MMARTYNOV506304262@EXAMPLE.COM"],"ldap_values":["SMTP:TEST____MMARTYNOV506304262@EXAMPLE.COM"]},"rbtadp":{"backup_values":["ou=granulex.test,cn=orgunits,cn=accounts,dc=granulex,dc=test"],"ldap_values":["ou=granulex.test,cn=orgunits,cn=accounts,dc=granulex,dc=test"]},"rbtamiddlename":{"backup_values":["Артёмович"],"ldap_values":["Артёмович"]},"rbtaou":{"backup_values":["granulex.test"],"ldap_values":["granulex.test"]},"sn":{"backup_values":["Мартынов"],"ldap_values":["Мартынов"]},"street":{"backup_values":["Советская"],"ldap_values":["Кирова"]},"telephoneNumber":{"backup_values":["+1 303 101 9122"],"ldap_values":["+1 303 379 7409"]},"title":{"backup_values":["Бухгалтер"],"ldap_values":["Младший программист"]},"uid":{"backup_values":["test____mmartynov506304262"],"ldap_values":["test____mmartynov506304262"]},"uidNumber":{"backup_values":["506304262"],"ldap_values":["506304262"]},"x-ald-aud-mask":{"backup_values":["0x0:0x0"],"ldap_values":["0x0:0x0"]},"x-ald-user-mac":{"backup_values":["0:0x0:0:0x0"],"ldap_values":["0:0x0:0:0x0"]},"xaldusermacmax":{"backup_values":["0"],"ldap_values":["0"]},"xaldusermacmin":{"backup_values":["0"],"ldap_values":["0"]}},"changed_attributes":{"carLicense":"0","departmentNumber":"0","employeeNumber":"0","entryusn":"0","facsimileTelephoneNumber":"0","l":"0","mobile":"0","modifiersName":"0","modifyTimestamp":"0","ou":"0","pager":"0","postalCode":"0","preferredLanguage":"0","street":"0","telephoneNumber":"0","title":"0"}}';

	async function* dataGenerator() {
		yield '[';
		for (let i = 0; i < len; i++) {
			let liter = '';
			for (let el of String(i)) {
				liter += LITERALS[el];
			}

			// Формируем строку аналогично вашему циклу
			const chunk =
				`{"obj_name":"uid=test____mmartynov${i},cn=users,cn=accounts,dc=granulex,dc=test","change_type":"${
					change_types[getRandomInt(0, 2)]
				}","obj_type":"${object_types[getRandomInt(0, 2)]}",` +
				last +
				(i !== len - 1 ? ',' : '');
			yield chunk;
		}
		yield ']';
	}

	try {
		// pipeline автоматически дождется завершения генератора и закроет поток
		await pipeline(dataGenerator, writeStream);
		console.log('Запись успешно завершена');
	} catch (err) {
		console.error('Ошибка при записи:', err);
	}
};

module.exports = createData;
