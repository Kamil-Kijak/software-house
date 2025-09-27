
const mailTransporter = require("./mailTransporter");

function sendMail(mailOptions) {
    mailTransporter.sendMail(mailOptions, (error, info) => {
        if(error) {
            return console.log("MAIL SEND ERROR --> ", error.message);
        }
        console.log("MAIL SENT --> ", info.response);
    })
}

module.exports = sendMail;