const express = require('express');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.send("Hello World!");
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
		res.status(500).send(err.message);
	}
});

// Endpoint to get date
app.post('/date', (req, res) => {
	try {
		const { date } = req.body
		const myDate = new Date(date)
		if (myDate != "Invalid Date") {
			res.send({
				date: (new DataBaseIO()).resetTimeToDate(myDate)
			})
		}
		else { res.status(400).send("Please provide valid date"); }
	} catch (err) {
		res.status(400).send("Please provide date");
	}
});

// Endpoint to get data by date
app.post('/dataByDate', async (req, res) => {
	try {
		const { date } = req.body
		const myDate = new Date(date)
		if (myDate != "Invalid Date") {
			res.json(await (new DataBaseIO()).readDatabyDate(myDate))
		}
		else { res.status(400).send("Please provide valid date"); }
	} catch (err) {
		res.status(400).send("Please provide date");
	}
});

// define the cron job to scrap data
cron.schedule(process.env.CRON_SCHEDULE, () => {
	console.log('Running cron job ');
	try {
		getDataFromCourtWebsite().then(() => {
			console.log("saved data");
		});
	} catch (err) {
		console.error(err);
	}
});

const PORT = process.env.port || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
