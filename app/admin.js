const { PrismaClient } = require('@prisma/client')
const express = require('express');
const { getDataFromCourtWebsiteAction, DataBaseIO } = require('./scrapData');
const { sendEmail } = require('./sendEmail');

const router = express.Router();
const prisma = new PrismaClient();

// fetch users
router.get('/users', async (req, res) => {
	// get all users from database
	const users = await prisma.appUser.findMany();

	const { error } = req.query;

	if (error) res.render('admin/users', { users, error });
	else res.render('admin/users', { users });
});

// insert new user
router.post('/users', async (req, res) => {
	const { username, password, email } = req.body;
	try {
		await prisma.appUser.create({
			data: {
				username,
				password,
				email,
			},
		});
		// get all users from database
		const users = await prisma.appUser.findMany();

		res.redirect('/admin/users');

	} catch (err) {
		// get all users from database
		const error = "Username already exists"
		res.redirect('/admin/users?error=' + encodeURIComponent(error));
	}
});

// edit email of user
router.post('/editEmail', async (req, res) => {
	try {
		const { username, email } = req.body;

		console.log(username, email);

		await prisma.appUser.update({
			where: {
				username: username,
			},
			data: {
				email: email,
			},
		});
		res.redirect('/admin/users');
	} catch (err) {
		const error = "Error Editing Email";
		res.redirect('/admin/users?error=' + encodeURIComponent(error));
	}
});

// edit password of user
router.post('/editPassword', async (req, res) => {
	try {
		const { username, password } = req.body;

		console.log(username, password);

		await prisma.appUser.update({
			where: {username: username},
			data: {password: password},
		});

		res.redirect('/admin/users');

	} catch (err) {
		const error = "Error Editing Password";
		res.redirect('/admin/users?error=' + encodeURIComponent(error));
	}
});

// delete user
router.post('/deleteUser/:id', async (req, res) => {
	const { id } = req.params;
	const { username } = req.body;

	console.log(id, username);

	try {
		// delete all alerts of this user
		await prisma.alert.deleteMany({
			where: {
				username: username,
			}
		});

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

router.get("/action", async (req, res) => {
	try {
		const { msg } = req.query;
		const today = new Date();
		const data = await (new DataBaseIO()).readDataForAction();

		res.render('admin/action', { data, date: getDateStr(today), today: getDateStr(today), msg });
	} catch (err) {
		console.log(err);
		res.status(500).send("Something is wrong on our side :(");
	}
});

router.post("/action", async (req, res) => {
	try{
		getDataFromCourtWebsiteAction();
		res.redirect('/admin/action?msg='+encodeURIComponent("We Are Scrapping Data, Please Refresh Page after 5 minutes."));
	}catch(err){
		console.log(err);
	}
});

router.post("/sendEmailAction", async (req, res) => {
	try {
		const { date } = req.body
		const myDate = new Date(date)
		console.log(myDate);

		sendEmail(myDate);

		res.redirect('/admin/action?msg='+encodeURIComponent("Sending Email..."));
	} catch (error) {
		console.log(error);
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

		res.render('admin/search', { date: getDateStr(new Date()), query, data });
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