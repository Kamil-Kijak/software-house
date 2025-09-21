
const bcrypt = require("bcrypt");

const sqlQuery = require("./mysqlQuery");
const sendMail = require("./sendMail");
const { nanoid } = require("nanoid");

async function requestEmailVerification(res, email) {
    const verificationExist = await sqlQuery(res, "SELECT COUNT(email) as count FROM email_verifications WHERE email = ?", [email]);
    if(verificationExist[0].count == 1) {
        await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
    }
    const code = nanoid(9);
    const codeHash = await bcrypt.hash(code, 12);
    const verificationInsertResult = await sqlQuery("INSERT INTO email_verifications() VALUES(?, ?, 0)", [email, codeHash]);
    // sending code email

}

module.exports = requestEmailVerification;