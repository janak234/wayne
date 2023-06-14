const { PrismaClient } = require('@prisma/client')
const express = require('express');
const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');

const router = express.Router();
const prisma = new PrismaClient();

// fetch users
router.get('/users', async (req, res) => {
	// get all users from database
	const users = await prisma.appUser.findMany();
	res.render('admin/users', { users });
});

// insert new user
router.post('/users', async (req, res) => {
	const { username, password } = req.body;
	try {
		await prisma.appUser.create({
			data: {
				username,
				password,
			},
		});
		// get all users from database
		const users = await prisma.appUser.findMany();

		res.render('admin/users', { users });
	} catch (err) {
		// get all users from database
		const users = await prisma.appUser.findMany();
		const error = "Username already exists"
		res.render('admin/users', { users, error });
	}
});

// delete user
router.post('/deleteUser/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await prisma.appUser.delete({
			where: {
				id: parseInt(id),
			},
		});
		res.redirect('/admin/users');
	} catch (err) {
		console.error(err);
		res.status(500).render('Error on our side');
	}
});

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
		res.render('admin/index', { data, date: getDateStr(today), today: getDateStr(today) });
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
			res.render('admin/index', { data, date: getDateStr(myDate), today: getDateStr(today) });
		}
		else {
			const data = await (new DataBaseIO()).readDatabyDate(today)
			res.render('admin/index', { data, date: getDateStr(today), today: getDateStr(today) });
		}
	} catch (err) {
		res.status(400).send("Please provide date");
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

		res.render('admin/search', {date:getDateStr(new Date()), query, data });
	} catch (err) {
		console.error(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

// Endpoint to get data by date
router.post('/dataByDate', async (req, res) => {
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

module.exports = router;