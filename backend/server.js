const express = require('express');
const path = require('path');
const createData = require('./create');

const app = express();
const port = 4000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/data', (req, res) => {
	res.sendFile(path.join(__dirname, 'output.json'));
});

app.post('/api/data', (req, res) => {
	console.log(req.body);
	createData(req.body.num)
		.then(() => {
			res.json('success');
		})
		.catch(err => {
			console.log(err);
			res.json('error');
		});
});

app.listen(port, () => {
	console.log(`http://localhost:${port}`);
});
