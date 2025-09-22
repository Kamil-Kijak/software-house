
const express = require("express");
const bcrypt = require("bcrypt")
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const {requestRegisterEmailVerification} = require("../utils/emailVerification");

const router = express.Router();

/*
    User endpoints for app API
    endpoints related to mysql users table
*/

router.post("/register_user", checkBody(["email", "username", "country", "password"]), async (req, res) => {
    const {email, username, country, password} = req.body;
    const checkEmailExistResult = await sqlQuery(res, "SELECT COUNT(email) as count FROM users WHERE email = ?", [email]);
    if(checkEmailExistResult[0].count == 0) {
        const checkUsernameExist = await sqlQuery(res, "SELECT COUNT(username) as count FROM users WHERE username = ?", [username]);
        if(checkUsernameExist[0].count == 0) {
            // checking email verification
            const checkEmailVerified = await sqlQuery(res, "SELECT count(email) as count FROM email_verifications WHERE email = ? AND verified = 1", [email]);
            if(checkEmailVerified[0].count == 0) {
                // request email verification
                await requestRegisterEmailVerification(res, email);
                res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
            } else {
                // register user
                const ID = nanoID.nanoid();
                const passwordHash = await bcrypt.hash(password, 12);
                await sqlQuery(res, "INSERT INTO users() VALUES(?, ?, ?, ?, ?, 0, NULL)", [ID, email, username, country, passwordHash]);
                console.log("Created new user with ID: ", ID);
                res.status(201).json({message:"registered successfully", ID:ID, registered:true});
            }
        } else {
            res.status(406).json({error:"This username is already taken"});
        }
    } else {
        res.status(406).json({error:"This email is already taken"});
    }
});

router.post("/verify_email", checkBody(["email", "code"]), async (req, res) => {
    const {email, code} = req.body;
    const verifyResult = await sqlQuery(res, "SELECT email, code_hash FROM email_verifications WHERE email = ?", [email]);
    if(verifyResult.length > 0) {
        if(await bcrypt.compare(code, verifyResult[0].code_hash)) {
            await sqlQuery(res, "UPDATE email_verifications SET verified = 1 WHERE email = ?", [email]);
            res.status(200).json({message:"verification succeed"});
        } else {
            res.status(400).json({error:"Invalid code"});
        }
    } else {
        res.status(404).json({error:"Email not found"});
    }
})

module.exports = router;