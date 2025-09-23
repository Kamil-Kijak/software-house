
const express = require("express");
const bcrypt = require("bcrypt")
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const {requestRegisterEmailVerification} = require("../utils/emailVerification");
const createRefreshToken = require("../utils/createRefreshToken");
const authorization = require("../utils/authorization");

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
            const checkEmailVerified = await sqlQuery(res, "SELECT expire_date FROM email_verifications WHERE email = ? AND verified = 1", [email]);
            if(checkEmailVerified.length == 0) {
                // request email verification
                await requestRegisterEmailVerification(res, email);
                res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
            } else {
                const expireDate = new Date(checkEmailVerified[0].expire_date);
                if(expireDate.getTime() >= new Date()) {
                    // register user
                    const ID = nanoID.nanoid();
                    const passwordHash = await bcrypt.hash(password, 12);
                    await sqlQuery(res, "INSERT INTO users() VALUES(?, ?, ?, ?, ?, 0, NULL)", [ID, email, username, country, passwordHash]);
                    console.log("Created new user with ID: ", ID);
                    res.status(201).json({message:"registered successfully", ID:ID, registered:true});
                } else {
                    // request email verification after expired verification
                    await requestRegisterEmailVerification(res, email);
                    res.status(202).json({message:"Creating new verification, because old expired", verificationCreated:true});
                }
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
});

router.post("/login_user", checkBody(["email", "password", "auto_login"]), async (req, res) => {
    const {email, password, auto_login} = req.body;
    const userResult = await sqlQuery(res, "SELECT ID, email, username, password_hash, double_verification FROM users WHERE email = ?", [email]);
    if(userResult.length > 0) {
        if(await bcrypt.compare(password, userResult[0].password_hash)) {
            const payload = {
                auto_login:auto_login,
                userID:userResult[0].ID,
                email:userResult[0].email,
                username:userResult[0].username
            }
            createRefreshToken(res, payload);
            res.status(200).json({message:"logged successfully", session:payload})
        } else {
            res.status(400).json({error:"Invalid password"})
        }
    } else {
        res.status(400).json({error:"Invalid email"})
    }
});

router.use(authorization());

router.get("/automatic_login", (req, res) => {
    const session = req.session;
    if(session.auto_login) {
        createRefreshToken(res, session);
        res.status(200).json({message:"logged successfully", session:payload});
    } else {
        res.status(403).json({error:"Access denied for automatic login"});
    }
});

router.get("/logout_user", (req, res) => {
    res.clearCookie("ACCESS_TOKEN");
    res.clearCookie("REFRESH_TOKEN");
    res.status(200).json({message:"Session ended"});
})

router.post("/update_profile", checkBody(["username", "country", "double_verification", "profile_description"]), async (req, res) => {
    const {username, country, double_verification, profile_description} = req.body;
    await sqlQuery(res, "UPDATE users SET username = ?, country = ?, double_verification = ?, profile_description = ?", [username, country, double_verification, profile_description]);
    res.status(200).json({message:"Profile updated"});
});

module.exports = router;