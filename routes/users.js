
const express = require("express");
const bcrypt = require("bcrypt");
const nanoID = require("nanoid");
const fs = require("fs");
const path = require("path");

const checkBody = require("../utils/checkBody");
const checkQuery = require("../utils/checkQuery");

const sqlQuery = require("../utils/mysqlQuery");
const {requestRegisterEmailVerification, requestEmailDoubleVerification, requestPasswordChangeEmailVerification} = require("../utils/emailVerification");
const createRefreshToken = require("../utils/createRefreshToken");
const authorization = require("../utils/authorization");
const sendMail = require("../utils/sendMail");
const {profileImageUpload} = require("../utils/multerUploads");

const router = express.Router();

function sendRegisterSucceedEmail(email, username) {
    const mailOptions = {
        from:`Software House <${process.env.MAIL_USER || "something@gmail.com"}>`,
        to:`${email}`,
        subject:"Software house registration complete",
        html:`
            <style>
                * {
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    font-family: Arial;
                }
            </style>


            <section style="background-color:#1C1C1C;padding: 0 5rem;">
                <section style="background-color:#1C1C1C;">
                    <h1 style="color:#c34800;text-align:center;padding: 1rem;">Software House registration succeed</h1>
                </section>
                <section style="background-color:#292929;padding: .5rem;">
                    <section style="margin-top: 10px;">
                        <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;">Hello ${username}</p>
                        <p style="color:white;text-align: center;font-size: 1.1rem;font-weight: bold;margin-top: .5rem;">Your email adress have been registered in 'Software House' service</p>
                    </section>
                    <section style="display: flex;justify-content: center;margin-top: 10px;">
                        <div style="border: 2px solid white;margin-top: 10px;width: 100%;"></div>
                    </section>
                    <section style="margin-top: 10px;">
                        <p style="color:white;text-align: center;font-size: 1.4rem;font-weight:bolder;margin-top: .4rem;padding: 1rem;">Explore softwares</p>
                        <p style="color:white;text-align: center;font-size: 1.4rem;font-weight:bolder;margin-top: .4rem;padding: 1rem;">Rate them and download</p>
                        <p style="color:white;text-align: center;font-size: 1.4rem;font-weight:bolder;margin-top: .4rem;padding: 1rem;">Publish your own software and things</p>
                        <p style="color:white;text-align: center;font-size: 1.6rem;font-weight:bolder;margin-top: 1rem;padding: 2rem;">Enjoy the service, ${username}</p>
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
            </section>
        `
    }
    sendMail(mailOptions);
}

/*
    User endpoints for app API
    endpoints related to mysql users table
*/

router.get("/registered_count", async (req, res) => {
    const countResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM users", []);
    res.status(200).json({message:"Selected count of registered users", count:countResult[0].count})
});

router.get("/username_available", checkQuery(["username"]), async (req, res) => {
    const {username} = req.query;
    const usernameExistResult = await sqlQuery("SELECT COUNT(ID) as count FROM users WHERE username = ?", [username]);
    if(usernameExistResult[0].count == 0) {
        res.status(200).json({message:"This username is available"});
    } else {
        res.status(409).json({error:"This username is already exist"});
    }
});

router.get("/email_available", checkQuery(["email"]), async (req, res) => {
    const {email} = req.query;
    const emailExistResult = await sqlQuery("SELECT COUNT(ID) as count FROM users WHERE username = ?", [email]);
    if(emailExistResult[0].count == 0) {
        res.status(200).json({message:"This email is available"});
    } else {
        res.status(409).json({error:"This email is already exist"});
    }
});

router.post("/register_user", checkBody(["email", "username", "country", "password"]), async (req, res) => {
    const {email, username, country, password} = req.body;
    const checkEmailExistResult = await sqlQuery(res, "SELECT COUNT(email) as count FROM users WHERE email = ?", [email]);
    if(checkEmailExistResult[0].count == 0) {
        const checkUsernameExist = await sqlQuery(res, "SELECT COUNT(username) as count FROM users WHERE username = ?", [username]);
        if(checkUsernameExist[0].count == 0) {
            // checking email verification
            const checkEmailVerified = await sqlQuery(res, "SELECT verified FROM email_verifications WHERE email = ? AND verified = 1", [email]);
            if(checkEmailVerified.length == 0) {
                // request email verification
                await requestRegisterEmailVerification(res, email);
                res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
            } else {
                // register user
                await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
                const ID = nanoID.nanoid();
                const passwordHash = await bcrypt.hash(password, 12);
                await sqlQuery(res, "INSERT INTO users() VALUES(?, ?, ?, ?, ?, 0, NULL)", [ID, email, username, country, passwordHash]);
                console.log("Created new user with ID: ", ID);
                // sending email after registration
                sendRegisterSucceedEmail(email, username);
                res.status(201).json({message:"Registered successfully", ID:ID, registered:true});
            }
        } else {
            res.status(409).json({error:"This username is already taken"});
        }
    } else {
        res.status(409).json({error:"This email is already taken"});
    }
});

router.post("/verify_email", checkBody(["email", "code"]), async (req, res) => {
    const {email, code} = req.body;
    const verifyResult = await sqlQuery(res, "SELECT email, code_hash, expire_date FROM email_verifications WHERE email = ?", [email]);
    if(verifyResult.length > 0) {
        // checking expire date and code
        const expireDate = new Date(verifyResult[0].expire_date);
        if(expireDate.getTime() >= new Date()) {
            if(await bcrypt.compare(code, verifyResult[0].code_hash)) {
                await sqlQuery(res, "UPDATE email_verifications SET verified = 1 WHERE email = ?", [email]);
                res.status(200).json({message:"Verification succeed"});
            } else {
                res.status(400).json({error:"Invalid code"});
            }
        } else {
            res.status(400).json({error:"Verification expired"});
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
            }
            if(userResult[0].double_verification == 1) {
                // checking email verification
                const checkEmailVerified = await sqlQuery(res, "SELECT verified FROM email_verifications WHERE email = ? AND verified = 1", [email]);
                if(checkEmailVerified.length == 0) {
                    // sending verification
                    await requestEmailDoubleVerification(res, email);
                    res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
                } else {
                    // login user
                    await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
                    createRefreshToken(res, payload);
                    res.status(200).json({message:"Logged successfully", session:payload})
                }
            } else {
                // login user
                createRefreshToken(res, payload);
                res.status(200).json({message:"Logged successfully", session:payload})
            }
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
});

router.get("/user_data", async (req, res) => {
    const {ID} = req.params;
    const result = await sqlQuery(res, "SELECT username, country, profile_description FROM users WHERE ID = ?", [ID]);
    res.status(200).json({message:"Retriviered user data", user_data:result[0]});
});

const getUserPicture = (res, ID) => {
    const directory = path.join(process.cwd(), "files", ID);
    const responseDefaultProfilePicture = () => {
        // It will be changed to sending default profile file
        res.status(404).json({error:"User profile picture not found"});
    }
    if(fs.existsSync(directory)) {
        fs.readdir(directory, (err, files) => {
            if(err) {
                responseDefaultProfilePicture();
            }
            const foundFile = files.find((file) => 
                path.parse(file).name == "profile"
            );
            if(!foundFile) {
                responseDefaultProfilePicture();
            } else {
                // sending profile picture
                res.status(200).sendFile(path.join(directory, foundFile));
            }
        })
    } else {
        responseDefaultProfilePicture();
    }
}


router.get("/user_picture", async (req, res) => {
    const {ID} = req.params;
    getUserPicture(res, ID);
});

router.get("/my_data", async (req, res) => {
    const result = await sqlQuery(res, "SELECT username, country, profile_description FROM users WHERE ID = ?", [req.session.userID]);
    res.status(200).json({message:"Retriviered my data", user_data:result[0]});
});

router.get("/my_picture", async (req, res) => {
    getUserPicture(res, req.session.userID);
});

router.post("/upload_profile_picture", profileImageUpload.single("file"), async (req, res) => {
    if(!req.file) {
        res.status(400).json({error:"Error with uploading file on the server"});
    }
    res.status(200).json({message:"Uploaded successfully"});
});


router.post("/update_email", checkBody(["new_email", "password"]), async (req, res) => {
    const {new_email, password} = req.body;
    const emailExistResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM users WHERE email = ?", [new_email]);
    if(emailExistResult[0].count == 0) {
        const actualUserResult = await sqlQuery(res, "SELECT password_hash FROM users WHERE ID = ?", [req.session.ID]);
        if(await bcrypt.compare(password, actualUserResult[0].password_hash)) {
            await sqlQuery(res, "UPDATE users SET email = ? WHERE ID", [new_email, req.session.ID]);
            res.status(200).json({message:"Email update succeed"});
        } else {
            res.status(400).json({error:"Invalid password"});
        }
    } else {
        res.status(409).json({error:"This email is already exist"});
    }
});

router.post("/update_password", checkBody(["new_password"]), async (req, res) => {
    const {new_password} = req.body;
    const actualUserResult = await sqlQuery(res, "SELECT email FROM users WHERE ID = ?", [req.session.userID]);
    const email = actualUserResult[0].email;
    // checking email verification
    const checkEmailVerified = await sqlQuery(res, "SELECT verified FROM email_verifications WHERE email = ? AND verified = 1", [email]);
    if(checkEmailVerified.length == 0) {
        // sending verification
        await requestPasswordChangeEmailVerification(res, email);
        res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
    } else {
        // changing password
        await sqlQuery(res, "DELETE FROM email_verifications WHERE email = ?", [email]);
        const newPasswordHash = bcrypt.hashSync(new_password, 12);
        await sqlQuery(res, "UPDATE users SET password_hash = ? WHERE ID = ?", [newPasswordHash, req.session.userID]);
        res.status(200).json({message:"Password updation succeed"})
    }
})



router.post("/update_profile", checkBody(["username", "country", "double_verification", "profile_description"]), async (req, res) => {
    const {username, country, double_verification, profile_description} = req.body;
    const usernameExistResult = await sqlQuery("SELECT COUNT(ID) as count FROM users WHERE username = ?", [username]);
    if(usernameExistResult[0].count == 0) {
        await sqlQuery(res, "UPDATE users SET username = ?, country = ?, double_verification = ?, profile_description = ? WHERE ID = ?", [username, country, double_verification, profile_description, req.session.userID]);
        res.status(200).json({message:"Profile updated"});
    } else {
        res.status(409).json({error:"This username is already exist"});
    }
});

router.delete("/delete_profile", checkBody(["password"]), async (req, res) => {
    const {password} = req.body;
    const userResult = await sqlQuery(res, "SELECT password_hash FROM users WHERE ID = ?", [req.session.userID]);
    if(userResult.length > 0) {
        if(await(bcrypt.compare(password, userResult[0].password_hash))) {
            await sqlQuery(res, "DELETE FROM users WHERE ID = ?", [req.session.userID]);
            console.log("Profile delete ID:", req.session.userID);
            res.status(200).json({message:"Delete succeed"});
        } else {
            res.status(403).json({error:"Invalid password"});
        }
    } else {
        res.status(404).json({error:"User not found"});
    }
})

module.exports = router;