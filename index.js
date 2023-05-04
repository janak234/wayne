const express = require('express');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function getPrevDate(date) {
	const prevDate = new Date(date);
	prevDate.setDate(prevDate.getDate() - 1);
	return prevDate;
}

function getDateStr(date) {
	return date.toISOString().substring(0, 10);
}

app.get("/", async (req, res) => {
	// today's data is fetched & stored yesterday
	try {
		const today = new Date();
		const yesterday = getPrevDate(today);

		const data = await (new DataBaseIO()).readDatabyDate(yesterday)
		res.render('index', { data, date: getDateStr(today), today: getDateStr(today) });
	} catch (err) {
		res.status(500).send("Something is wrong on our side :(");
	}
});

app.post("/", async (req, res) => {
	// today's data is fetched & stored yesterday
	try {
		const { date } = req.body
		const myDate = new Date(date)
		const today = new Date();
		const myDate_1 = getPrevDate(myDate);

		if (myDate != "Invalid Date") {
			const data = await (new DataBaseIO()).readDatabyDate(myDate_1)
			res.render('index', { data, date: getDateStr(myDate), today: getDateStr(today)});
		}
		else {
			const data = await (new DataBaseIO()).readDatabyDate(today)
			res.render('index', { data, date: getDateStr(today), today: getDateStr(today) });
		}
	} catch (err) {
		res.status(400).send("Please provide date");
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
		res.status(500).send(err.message);
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
