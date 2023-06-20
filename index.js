const express = require('express');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const {sendEmail} = require('./app/sendEmail');

const { getDataFromCourtWebsite, DataBaseIO } = require('./app/scrapData');
const { createAdmin, router: authRoutes, requireAdminAuth, requireUserAuth } = require('./app/auth');
const userRouter = require('./app/user');
const adminRoutes = require('./app/admin');

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));

app.get("/hello", (req, res) => {
	res.send('Hello World!');
});	

app.post('/sendTestMail', (req, res) => {
	sendEmail();
	res.send('Sending Mail Please Wait');
});

app.use("/auth", authRoutes);

app.use("/admin", requireAdminAuth, adminRoutes);

app.use("/user", requireUserAuth, userRouter);

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

app.use((req, res, next) => {
	res.status(404).render('404');
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

// schedule email sending
cron.schedule(process.env.EMAIL_CRON_SCHEDULE, () => {
	console.log('Running email cron job ');
	try {
		sendEmail();
	}catch(err){
		console.error(err);
	}
});

const PORT = process.env.port || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	createAdmin()
		.catch(err => console.error('Failed to create admin user:', err));
});
