const express = require('express');
const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');

const router = express.Router();

function getPrevDate(date) {
	const prevDate = new Date(date);
	prevDate.setDate(prevDate.getDate() - 1);
	return prevDate;
}

function getDateStr(date) {
	return date.toISOString().substring(0, 10);
}

router.get("/", async (req, res) => {
	// today's data is fetched & stored yesterday
	try {
		const today = new Date();
		const yesterday = getPrevDate(today);

		const data = await (new DataBaseIO()).readDatabyDate(yesterday)
		res.render('user/index', { data, date: getDateStr(today), today: getDateStr(today) });
	} catch (err) {
		console.log(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

router.post("/", async (req, res) => {
	// today's data is fetched & stored yesterday
	try {
		const { date } = req.body
		const myDate = new Date(date)
		const today = new Date();
		const myDate_1 = getPrevDate(myDate);

		if (myDate != "Invalid Date") {
			const data = await (new DataBaseIO()).readDatabyDate(myDate_1)
			res.render('user/index', { data, date: getDateStr(myDate), today: getDateStr(today)});
		}
		else {
			const data = await (new DataBaseIO()).readDatabyDate(today)
			res.render('user/index', { data, date: getDateStr(today), today: getDateStr(today) });
		}
	} catch (err) {
		res.status(400).send("Please provide date");
	}
});

module.exports = router;