
const bcrypt = require("bcrypt");
const {DateTime} = require("luxon")

const sqlQuery = require("./mysqlQuery");
const sendMail = require("./sendMail");
const { nanoid } = require("nanoid");

async function requestRegisterEmailVerification(res, email) {
    const verificationExist = await sqlQuery(res, "SELECT COUNT(email) as count FROM email_verifications WHERE email = ?", [email]);
    if(verificationExist[0].count == 1) {
        await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
    }
    const code = nanoid(9);
    const codeHash = await bcrypt.hash(code, 12);

    const now = DateTime.local();
    const futureDate = now.plus({hours:1})
    await sqlQuery(res, "INSERT INTO email_verifications() VALUES(?, ?, 0, ?)", [email, codeHash, futureDate.toISO()]);
    console.log(`Inserted new email verification for email ${email}. Expire date: ${futureDate.toLocaleString(DateTime.DATETIME_SHORT)}`);
    // sending code email
    const mailOptions = {
        from:`Software House <${process.env.MAIL_USER || "something@gmail.com"}>`,
        to:`${email}`,
        subject:"Software House email verification",
        html:`
            Your verification code for mail ${email} is
            <h1>${code}</h1>
        `
    }
    sendMail(mailOptions);

}

module.exports = {requestRegisterEmailVerification};