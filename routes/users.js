
const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const {body, validationResult, query} = require("express-validator");

const {requestRegisterEmailVerification, requestEmailDoubleVerification, requestPasswordChangeEmailVerification} = require("../utils/emailVerification");
const createRefreshToken = require("../utils/createRefreshToken");
const authorization = require("../utils/authorization");
const sendMail = require("../utils/sendMail");
const {profileImageUpload} = require("../utils/multerUploads");

const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const SocialLink = require("../models/SocialLink");
const Subscription = require("../models/Subscription")


const router = express.Router();


// sending email after successfull registration
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

// sending count of registrated users
router.get("/registered_count", async (req, res) => {
    const count = await User.count();
    res.status(200).json({message:"Selected count of registered users", count:count})
});

// checking if username already exist
router.get("/username_available", [
    query("username").trim().exists({checkFalsy:true}).withMessage("Username is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {username} = req.query;
    const trimmedUsername = username.trim();
    const count = await User.count({
        where:{
            username:trimmedUsername
        }
    });
    if(count == 0) {
        res.status(200).json({message:"This username is available"});
    } else {
        res.status(409).json({error:"This username is already exist"});
    }
});

// checking if email is available
router.get("/email_available", [
    query("email").trim().exists({checkFalsy:true}).withMessage("Email is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {email} = req.query;
    const trimmedEmail = email.trim();
    const count = await User.count({
        where:{
            email:trimmedEmail
        }
    });
    if(count == 0) {
        res.status(200).json({message:"This email is available"});
    } else {
        res.status(409).json({error:"This email is already exist"});
    }
});

// user registration
router.post("/register_user", [
    body("email").trim().exists({checkFalsy:true}).withMessage("Email is required").isLength({max:50}).withMessage("Max email length: 50").
    isEmail().withMessage("Email is not correct"),
    body("username").trim().exists({checkFalsy:true}).withMessage("Username is required").isLength({max:50}).withMessage("Max username length: 50"),
    body("country").trim().exists({checkFalsy:true}).withMessage("Country is required").isLength({max:50}).withMessage("Max country length: 50"),
    body("password").exists({checkFalsy:true}).isLength({min:8}).withMessage("Min password length: 8")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {email, username, country, password} = req.body;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const emailExist = await User.count({
        where:{
            email:trimmedEmail
        }
    });
    if(emailExist == 0) {
        const usernameExist = await User.count({
            where:{
                username:trimmedEmail
            }
        });
        if(usernameExist== 0) {
            // checking email verification
            const emailVerified = await EmailVerification.count({
                where:{
                    email:trimmedEmail,
                    verified:true
                }
            });
            if(emailVerified == 0) {
                // request email verification
                await requestRegisterEmailVerification(res, trimmedEmail);
                res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
            } else {
                // register user
                await EmailVerification.destroy({where:{email:trimmedEmail}});
                const passwordHash = await bcrypt.hash(password, 12);
                const user = await User.create({
                    email:trimmedEmail,
                    username:trimmedUsername,
                    country:country,
                    passwordHash:passwordHash,
                });
                if(Number(process.env.CONSOLE_LOGS)) {
                    console.log(`Created new user with account ID ${user.ID}`);
                }
                // sending email after registration
                sendRegisterSucceedEmail(trimmedEmail, trimmedUsername);
                res.status(201).json({message:"Registered successfully", ID:user.ID, registered:true});
            }
        } else {
            res.status(409).json({error:"This username is already taken"});
        }
    } else {
        res.status(409).json({error:"This email is already taken"});
    }
});

// email verification using sended by email code
router.post("/verify_email", [
    body("email").trim().exists().withMessage("email is required").isLength({max:50}).withMessage("Email max length: 50").
    isEmail().withMessage("email is not correct"),
    body("code").exists().withMessage("code is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {email, code} = req.body;
    const trimmedEmail = email.trim();
    const verifyResult = await EmailVerification.findOne({attributes:["codeHash", "expireDate"], where:{email:trimmedEmail}});
    if(verifyResult) {
        // checking expire date and code
        const expireDate = new Date(verifyResult.expireDate);
        console.log(expireDate)
        console.log(new Date())
        if(expireDate.getTime() >= new Date().getTime()) {
            if(await bcrypt.compare(code, verifyResult.codeHash)) {
                await EmailVerification.update({verified:true}, {where:{email:trimmedEmail}});
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

// user login
router.post("/login_user", [
    body("email").trim().exists().withMessage("Email is required").isLength({max:50}).withMessage("Email max length: 50").
    isEmail().withMessage("Email is not correct"),
    body("password").exists({checkFalsy:true}).withMessage("Password is required"),
    body("autoLogin").exists().withMessage("autoLogin is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {email, password, autoLogin} = req.body;
    const trimmedEmail = email.trim();
    const user = await User.findOne({
        attributes:["ID", "email", "username", "passwordHash", "doubleVerification"],
        where:{
            email:trimmedEmail
        }
    });
    if(user) {
        if(await bcrypt.compare(password, user.passwordHash)) {
            const payload = {
                autoLogin:autoLogin ? 1 : 0,
                userID:user.ID,
            }
            if(user.doubleVerification == 1) {
                // checking email verification
                const verified = await EmailVerification.count({where:{email:trimmedEmail, verified:true}});
                if(verified == 0) {
                    // sending verification
                    await requestEmailDoubleVerification(res, trimmedEmail);
                    res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
                } else {
                    // login user
                    await EmailVerification.destroy({where:{email:trimmedEmail}});
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

// requesting user data by specific ID
router.get("/user_data/:ID", async (req, res) => {
    const {ID} = req.params;
    const user = await User.findByPk(ID, {
        attributes:["username", "country", "profileDescription"]
    });
    const socialLinks = await SocialLink.findAll({
        attributes:["name", "href"],
        where:{
            idUser:ID
        }
    });
    const subscriptionsCount = await Subscription.count({where:{idUser:ID}});
    const subscribersCount = await Subscription.count({where:{idSubscribed:ID}});
    if(user) {
        res.status(200).json({
            message:"Retriviered user data",
            user:user,
            user_social_links:socialLinks,
            subscriptionsCount:subscriptionsCount,
            subscribersCount:subscribersCount,
        });
    } else {
        res.status(404).json({error:"User not found"});
    }
});

// requesting user profile picture
router.get("/user_picture/:ID", async (req, res) => {
    const {ID} = req.params;
    getUserPicture(res, ID);
});

router.use(authorization());

// automatic login at start of the application, where user checked remember me
router.get("/automatic_login", (req, res) => {
    const session = req.session;
    if(session.autoLogin) {
        createRefreshToken(res, session);
        res.status(200).json({message:"logged successfully", session:req.session});
    } else {
        res.status(403).json({error:"Access denied for automatic login"});
    }
});

// logout user and deleting cookies
router.get("/logout_user", (req, res) => {
    res.clearCookie("ACCESS_TOKEN");
    res.clearCookie("REFRESH_TOKEN");
    res.status(200).json({message:"Session ended"});
});


// gettting user picture
const getUserPicture = (res, ID) => {
    const directory = path.join(process.cwd(), "files", ID);
    const responseDefaultProfilePicture = () => {
        res.status(404).sendFile(path.join(process.cwd(), "assets", "defaultUserPicture.png"));
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

// requesting session user data (from ID in cookie)
router.get("/my_data", async (req, res) => {
    const ID = req.session.userID;
    const user = await User.findByPk(ID, {
        attributes:["username", "country", "profileDescription"]
    });
    const socialLinks = await SocialLink.findAll({
        attributes:["name", "href"],
        where:{
            idUser:ID
        }
    });
    const subscriptionsCount = await Subscription.count({where:{idUser:ID}});
    const subscribersCount = await Subscription.count({where:{idSubscribed:ID}});
    res.status(200).json({
        message:"Retriviered user data",
        user:user,
        user_social_links:socialLinks,
        subscriptionsCount:subscriptionsCount,
        subscribersCount:subscribersCount,
    });
});

// requesting session user data (from ID in cookie)
router.get("/my_picture", async (req, res) => {
    getUserPicture(res, req.session.userID);
});

// uploading session user profile picture
router.post("/upload_profile_picture", profileImageUpload.single("file"), async (req, res) => {
    if(!req.file) {
        res.status(400).json({error:"Error with uploading file on the server"});
    }
    res.status(201).json({message:"Uploaded successfully"});
});


// email updation on session user
router.put("/update_email", [
    body("newEmail").trim().exists({checkFalsy:true}).withMessage("newEmail is required").isLength({max:50}).withMessage("newEmail max length: 50").
    isEmail().withMessage("newEmail is not correct"),
    body("password").exists({checkFalsy:true}).withMessage("password is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {newEmail, password} = req.body;
    const newEmailTrimmed = newEmail.trim();
    const emailExist = await User.count({where:{email:newEmailTrimmed}});
    if(emailExist == 0) {
        const actualUser = await User.findByPk(req.session.userID, {attributes:["passwordHash"]});
        if(await bcrypt.compare(password, actualUser.passwordHash)) {
            const [affectedRows] = await User.update({email:newEmailTrimmed}, {where:{id:req.session.userID}});
            res.status(200).json({message:"Email update succeed", affectedRows});
        } else {
            res.status(400).json({error:"Invalid password"});
        }
    } else {
        res.status(409).json({error:"This email is already exist"});
    }
});

// password updation on session user
router.put("/update_password", [
    body("newPassword").exists({checkFalsy:true}).withMessage("password is required").isLength({min:8}).withMessage("password min length: 8")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {newPassword} = req.body;
    const user = await User.findByPk(req.session.userID, {attributes:["email"]});
    // checking email verification
    const emailVerified = await EmailVerification.count({where:{email:user.email, verified:true}})
    if(emailVerified == 0) {
        // sending verification
        await requestPasswordChangeEmailVerification(res, user.email);
        res.status(202).json({message:"Verification created waiting for verify email", verificationCreated:true});
    } else {
        // changing password
        await EmailVerification.destroy({where:{email:user.email}});
        const newPasswordHash = bcrypt.hashSync(newPassword, 12);
        const [affectedRows] = await User.update({passwordHash:newPasswordHash}, {where:{id:req.session.userID}})
        res.status(200).json({message:"Password update succeed", affectedRows});
    }
});


// request profile update on session user
router.put("/update_profile", [
    body("username").trim().exists({checkFalsy:true}).withMessage("username is required").isLength({max:50}).withMessage("username max length: 50"),
    body("country").trim().exists({checkFalsy:true}).withMessage("country is required").isLength({max:50}).withMessage("country max length: 50"),
    body("profileDescription").exists({checkFalsy:true}).withMessage("profileDescription is required").isLength({max:255}).withMessage("profileDescription max length: 255"),
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {username, country, doubleVerification, profileDescription} = req.body;
    const trimmedUsername = username.trim();
    const usernameExist = await User.count({where:{username:trimmedUsername}});
    if(usernameExist == 0) {
        const [affectedRows] = await User.update({username:trimmedUsername, country, profileDescription, doubleVerification}, 
            {where:{id:req.session.userID}}
        )
        res.status(200).json({message:"Profile updated", affectedRows});
    } else {
        res.status(409).json({error:"This username is already exist"});
    }
});


// request profile delete (protected using password)
router.delete("/delete_profile", [
    body("password").exists({checkFalsy:true}).withMessage("password is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {password} = req.body;
    const ID = req.session.userID;
    const user = await User.findByPk(ID, {attributes:["passwordHash"]});
    if(user) {
        if(await(bcrypt.compare(password, user.password_hash))) {
            const affectedRows = await User.destroy({where:{id:ID}})
            if(Number(process.env.CONSOLE_LOGS)) {
                console.log(`Deleted user account ID ${ID}`);
            }
            res.clearCookie("ACCESS_TOKEN");
            res.clearCookie("REFRESH_TOKEN");
            res.status(200).json({message:"Delete succeed", affectedRows});
        } else {
            res.status(403).json({error:"Invalid password"});
        }
    } else {
        res.status(404).json({error:"User not found"});
    }
});

module.exports = router;