
const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.MAIL_USER || "something@gmail.com",
        pass:process.env.MAIL_PASSWORD || "password"
    }
});

module.exports = transporter;