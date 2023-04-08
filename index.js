const express = require('express');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const { getDataFromCourtWebsite,DataBaseIO } = require('./scrapData');

const app = express();

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Endpoint to read data
app.get('/data', async (req, res) => {
	try {
		const data = await (new DataBaseIO()).readData();
		res.json(data);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error reading data.');
	}
});

// Endpoint to write data
app.post('/data', async (req, res) => {
	try {
		getDataFromCourtWebsite().then((data) => {
			console.log("saved data");
		});
		res.status(200).send('Wait for 3 minutes to get the data');
	} catch (err) {
		console.error(err);
		res.status(500).send('Error writing data.');
	}
});

const PORT = process.env.port || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
