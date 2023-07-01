const nodemailer = require('nodemailer');
const pug = require('pug');
const { DataBaseIO } = require('./scrapData');

const sendMail = async (date, email, name, alerts) => {
    const emailId = process.env.EMAIL_ID;
    const emailPasswd = process.env.EMAIL_PASSWD;

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'mail.trusafe.au',
        port: 465, // Replace with the appropriate port number
        secure: true, // Set it to true if your server requires a secure connection (e.g., SSL/TLS)
        auth: {
            user: emailId,
            pass: emailPasswd
        }
    });

    // get date in dd/mm/yyyy format
    const myDate = (date).toLocaleDateString('en-GB');

    const emailBody = pug.compileFile("app/sendEmail.template.pug")({ username: name, keywordList: alerts, date: myDate });

    // setup email data with unicode symbols
    let mailOptions = {
        from: emailId, // sender address
        to: email, // list of receivers
        subject: 'Alert For Court Listing', // Subject line
        html: emailBody
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw new Error(error);
        }
        console.log('Message sent: %s', info);
    });
}

const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

const sendEmail = async (forDate = getTomorrow()) => {
    try {
        const userActiveAlerts = await (new DataBaseIO()).getUserActiveAlerts(new Date());
        console.log(userActiveAlerts);

        for (let user of userActiveAlerts) {
            const { email, name, alerts } = user;
            if (alerts.length > 0) {
                const alertStr = alerts.join(', ');
                await sendMail(forDate, email, name, alertStr);
            }
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = { sendEmail };
