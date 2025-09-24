
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
    console.log(`Inserted new register email verification for email ${email}. Expire date: ${futureDate.toLocaleString(DateTime.DATETIME_SHORT)}`);
    // sending code email
    const mailOptions = {
        from:`Software House <${process.env.MAIL_USER || "something@gmail.com"}>`,
        to:`${email}`,
        subject:"Software House email verification",
        html:`
            <style>
                * {
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    font-family: Arial;
                }
            </style>


            <section style="background-color:#1C1C1C;">
                <h1 style="color:#c34800;text-align:center;padding: 1rem;">Welcome to Software House service</h1>
            </section>
            <section style="background-color:#292929;padding: .5rem;">
                <section style="margin-top: 10px;">
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;">You are trying to register using your email adress</p>
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;margin-top: .5rem;">to our 'Software House' service</p>
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;margin-top: .5rem;">We need to verificate your email before registration</p>
                </section>
                <section style="display: flex;justify-content: center;margin-top: 10px;">
                    <div style="border: 2px solid white;margin-top: 10px;width: 100%;"></div>
                </section>
                <section style="margin-top: 10px;">
                    <p style="color:white;text-align: center;font-size: 1.8rem;font-weight:bolder;margin-top: 1rem;">Here is your email verification code</p>
                </section>
                <section style="margin: 3rem;background-color: #1C1C1C;padding: 1rem;display: flex;justify-content: center;">
                    <h1 style="color:white;text-align: center;font-size: 1.7rem;font-weight:bolder;margin: auto;">${code}</h1>
                </section>
            </section>
            <section style="background-color: #1C1C1C;padding: .5rem;">
                <section>
                    <h1 style="color:#c34800;text-align:center;padding: 1rem;">Software house</h1>
                </section>
                <section>
                    <h1 style="color:#c34800;text-align:center;padding: 1rem;font-size: 1.2rem;">© Copyright 2026 Kamil Kijak</h1>
                </section>
            </section>
        `
    }
    sendMail(mailOptions);

}
async function requestEmailDoubleVerification(res, email) {
    const verificationExist = await sqlQuery(res, "SELECT COUNT(email) as count FROM email_verifications WHERE email = ?", [email]);
    if(verificationExist[0].count == 1) {
        await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
    }
    const code = nanoid(9);
    const codeHash = await bcrypt.hash(code, 12);

    const now = DateTime.local();
    const futureDate = now.plus({hours:1})
    await sqlQuery(res, "INSERT INTO email_verifications() VALUES(?, ?, 0, ?)", [email, codeHash, futureDate.toISO()]);
    console.log(`Inserted new email double-verification for email ${email}. Expire date: ${futureDate.toLocaleString(DateTime.DATETIME_SHORT)}`);
    // sending code email
    const mailOptions = {
        from:`Software House <${process.env.MAIL_USER || "something@gmail.com"}>`,
        to:`${email}`,
        subject:"Software House email verification for double-verification",
        html:`
            <style>
                * {
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    font-family: Arial;
                }
            </style>


            <section style="background-color:#1C1C1C;">
                <h1 style="color:#c34800;text-align:center;padding: 1rem;">Welcome to Software House service</h1>
            </section>
            <section style="background-color:#292929;padding: .5rem;">
                <section style="margin-top: 10px;">
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;">You are trying to login</p>
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;margin-top: .5rem;">to our 'Software House' service</p>
                    <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;margin-top: .5rem;">We are sending security code for login</p>
                </section>
                <section style="display: flex;justify-content: center;margin-top: 10px;">
                    <div style="border: 2px solid white;margin-top: 10px;width: 100%;"></div>
                </section>
                <section style="margin-top: 10px;">
                    <p style="color:white;text-align: center;font-size: 1.8rem;font-weight:bolder;margin-top: 1rem;">Here is your security code</p>
                </section>
                <section style="margin: 3rem;background-color: #1C1C1C;padding: 1rem;display: flex;justify-content: center;">
                    <h1 style="color:white;text-align: center;font-size: 1.7rem;font-weight:bolder;margin: auto;">${code}</h1>
                </section>
            </section>
            <section style="background-color: #1C1C1C;padding: .5rem;">
                <section>
                    <h1 style="color:#c34800;text-align:center;padding: 1rem;">Software house</h1>
                </section>
                <section>
                    <h1 style="color:#c34800;text-align:center;padding: 1rem;font-size: 1.2rem;">© Copyright 2026 Kamil Kijak</h1>
                </section>
            </section>
        `
    }
    sendMail(mailOptions);
}

module.exports = {requestRegisterEmailVerification, requestEmailDoubleVerification};