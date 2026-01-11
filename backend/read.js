const { readFileSync } = require('fs');

const data = readFileSync('./output.txt', 'utf8');

const users = JSON.parse(data);

console.log(users.length);
