const express = require('express');
const { getDataFromCourtWebsite, DataBaseIO } = require('./scrapData');
const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

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
		const error = req.query.error;

		const alerts = await prisma.alert.findMany({
			where: {
				username: username
			}
		});

		if(error) {
			res.render('user/alerts', { alerts, error });
			return;
		}

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

// upload alerts from excel file
router.post("/alerts/upload",upload.single('file'), async (req, res) => {
	try {
		// Read the uploaded file
		const workbook = XLSX.readFile(req.file.path);

		// Get the first sheet
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
	  
		// Get the range of cells with data
		const range = XLSX.utils.decode_range(sheet['!ref']);
	  
		// Loop through each row and print the value of the first (and only) column
		const data = [];
		for (let i = range.s.r; i <= range.e.r; i++) {
		  const cellAddress = XLSX.utils.encode_cell({ r: i, c: 0 });
		  const cell = sheet[cellAddress];
		  data.push(cell.v);
		}
	  
		data.shift();
		console.log(data);

		if(data.length > 0) {
			await prisma.alert.createMany({
				data: data.map(text => {
					return {
						username: req.session.user.username,
						text: text,
					}
				}),
			});
		}

		res.redirect('/user/alerts');
	} catch (err) {
		console.log(err);
		const error = "Invalid File Uploaded";
		res.redirect('/user/alerts?error='+encodeURIComponent(error));
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