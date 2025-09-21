
const express = require("express");
const bcrypt = require("bcrypt")
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const requestEmailVerification = require("../utils/emailVerification");

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
            const checkEmailVerified = await sqlQuery(res, "SELECT count(email) FROM email_verifications WHERE email = ? AND verified = 1", [email]);
            if(checkEmailVerified[0].count == 0) {
                // request email verification
                await requestEmailVerification(res, email);
                res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
            } else {
                // register user
                const ID = nanoID.nanoid();
                const passwordHash = await bcrypt.hash(password, 12);
                const insertUserResult = await sqlQuery(res, "INSERT INTO users() VALUES(?, ?, ?, ?, ?, 0, NULL)", [ID, email, username, country, passwordHash]);
                console.log("Created new user with ID: ", ID);
                res.status(201).json({message:"registered successfully", ID:insertUserResult.insertId});
            }
        } else {
            res.status(406).json({error:"This username is already taken"});
        }
    } else {
        res.status(406).json({error:"This email is already taken"});
    }
    res.status(200).json({result});
});

module.exports = router;