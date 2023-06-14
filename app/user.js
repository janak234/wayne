const express = require('express');
const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient();

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
			res.render('user/index', { data, date: getDateStr(myDate), today: getDateStr(today) });
		}
		else {
			const data = await (new DataBaseIO()).readDatabyDate(today)
			res.render('user/index', { data, date: getDateStr(today), today: getDateStr(today) });
		}
	} catch (err) {
		res.status(400).send("Please provide date");
	}
});

const alerts = [
	{
		id: 1,
		text: "hello",
	},
	{
		id: 2,
		text: "world",
	}
];

var counter = 3;

// alerts
router.get('/alerts', async (req, res) => {
	try {
		const username = req.session.user.username;

		const alerts = await prisma.alert.findMany({
			where: {
				username: username
			}
		});
		res.render('user/alerts', { alerts });
	} catch (error) {
		console.log(error);
		res.status(500).send("Something is wrong on our side :(");
	}
});

// add alerts
router.post('/alerts', async (req, res) => {
	try {
		const username = req.session.user.username;
		const { text } = req.body;

		await prisma.alert.create({
			data: {
				username: username,
				text: text,
			}
		});

		res.redirect('/user/alerts');
	} catch (err) {
		console.error(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

// delete alert
router.post("/deleteAlert/:id", async (req, res) => {
	try {
		const alertId = parseInt(req.params.id);

		await prisma.alert.delete({
			where: { id: alertId }
		})

		res.redirect('/user/alerts');

	} catch (err) {
		console.error(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

// search route
router.post('/search', async (req, res) => {
	try {
		const { query } = req.body;

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const _60daysAgo = new Date();
		_60daysAgo.setDate(_60daysAgo.getDate() - 60);

		var data = await (new DataBaseIO()).searchRecord(query, _60daysAgo, tomorrow);
		// console.log(data);
		// data = JSON.stringify(JSON.parse(data));

		res.render('user/search', { date: getDateStr(new Date()), query, data });
	} catch (err) {
		console.error(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

module.exports = router;