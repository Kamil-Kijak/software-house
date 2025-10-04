
const mailTransporter = require("./mailTransporter");

function sendMail(mailOptions) {
    mailTransporter.sendMail(mailOptions, (error, info) => {
        if(error) {
            if(Number(process.env.CONSOLE_LOGS)) {
                console.log(`Error in sending MAIL: ${error.message}`);
            }
            return;
        }
    })
}

module.exports = sendMail;