const express = require('express');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const { DataFileIO,getDataFromCourtWebsite } = require('./scrapData');

const app = express();
const filePath = 'data.json';

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Endpoint to read data
app.get('/data', async (req, res) => {
	try {
		var dataFileIO = new DataFileIO();
		var data = await dataFileIO.readData();
		res.json(data);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error reading data.');
	}
});

// Endpoint to write data
app.post('/data', async (req, res) => {
	try {
		getDataFromCourtWebsite();
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
