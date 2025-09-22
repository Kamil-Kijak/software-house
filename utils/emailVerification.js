
const bcrypt = require("bcrypt");

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
    await sqlQuery(res, "INSERT INTO email_verifications() VALUES(?, ?, 0)", [email, codeHash]);
    console.log("Inserted new email verification --> ", email);
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