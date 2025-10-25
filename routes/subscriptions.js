
const express = require("express");
const nanoID = require("nanoid");
const {query, body, validationResult} = require("express-validator");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const sendNotification = require("../utils/sendNotification");

const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");


const router = express.Router();

/*
    Subscriptions endpoints for app API
    endpoints related to mysql subscriptions table
*/


// request users subscribed by user with ID
router.get("/user_subscriptions/:ID", checkQuery(["usernameFilter", "limit"]), async (req, res) => {
    const {ID} = req.params;
    const {limit, usernameFilter} = req.query;
    let sqlString = "SELECT u.username, u.ID, u.profile_description, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?";
    const params = [ID]
    if(usernameFilter) {
        sqlString+= " AND u.username LIKE ?";
        params.push(`%${usernameFilter}%`);
    }
    sqlString+= " LIMIT ?";
    params.push(limit || "200");
    const subscriptionsResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retrivied successfully", subscriptionsData:subscriptionsResult});
});


// request users which subscribe user with ID
router.get("/user_subscribers/:ID", checkQuery(["usernameFilter", "limit"]), async (req, res) => {
    const {ID} = req.params;
    const {limit, usernameFilter} = req.query;
    let sqlString = "SELECT u.username, u.ID, u.profile_description FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?";
    const params = [ID]
    if(usernameFilter) {
        sqlString+= " AND u.username LIKE ?";
        params.push(`%${usernameFilter}%`);
    }
    sqlString+= " LIMIT ?";
    params.push(limit || "200");
    const subscribersResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retrivied successfully", subscribersData:subscribersResult});
});

router.use(authorization());

// requesting data about user subscribed, subscription notifications
router.get("/subscriptions_data/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscriberResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM subscriptions WHERE ID_subscribed = ? AND ID_user = ?", [req.session.userID, ID]);
    const subscribedResult = await sqlQuery(res, "SELECT notifications FROM subscriptions WHERE ID_subscribed = ? AND ID_user = ? LIMIT 1", [ID, req.session.userID]);
    res.status(200).json({
        message:"Retriviered user subscriptions data",
        subscribe:subscriberResult[0].count > 0,
        subscribed:subscribedResult.length > 0,
        subscribedNotifications:subscribedResult[0] ? subscribedResult[0].notifications : null
    });
});

// request users subscribed by session user
router.get("/my_subscriptions", checkQuery(["usernameFilter", "limit"]), async (req, res) => {
    const {usernameFilter, limit} = req.query;
    let sqlString = "SELECT u.username, u.ID, u.profile_description, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?";
    const params = [req.session.userID];
    if(usernameFilter) {
        sqlString+= " AND u.username LIKE ?";
        params.push(`%${usernameFilter}%`);
    }
    sqlString+= " LIMIT ?";
    params.push(limit || "200");
    const subscriptionsResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retrivied successfully", subscriptionsData:subscriptionsResult});
});

// request users which subscribe session user
router.get("/my_subscribers", checkQuery(["usernameFilter", "limit"]), async (req, res) => {
    const {limit, usernameFilter} = req.query;
    let sqlString = "SELECT u.username, u.ID, u.profile_description FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?";
    const params = [req.session.userID];
    if(usernameFilter) {
        sqlString+= " AND u.username LIKE ?";
        params.push(`%${usernameFilter}%`);
    }
    sqlString+= " LIMIT ?";
    params.push(limit || "200");
    const subscribersResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retrivied successfully", subscribersData:subscribersResult});
});

// toggling subscription
router.post("/toggle_subscription", checkBody(["IDUser"]), async (req, res) => {
    const {IDUser} = req.body;
    const subscriptionExistResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM subscriptions WHERE ID_user = ? AND ID_subscribed = ?", [req.session.userID, IDUser]);
    if(subscriptionExistResult[0].count == 0) {
        // if subscription don't exist
        await sqlQuery(res, "INSERT INTO subscriptions() VALUES(?, ?, ?, ?)", [nanoID.nanoid(), req.session.userID, IDUser, "all"]);
        // sending notification
        const userResult = await sqlQuery(res, "SELECT username FROM users WHERE ID = ?", [req.session.userID]);
        await sendNotification(res, `User ${userResult[0].username} is now subscribing you`, null, IDUser);
        res.status(201).json({message:"New subscription Created"});
    } else {
        const deleteResult = await sqlQuery(res, "DELETE FROM subscriptions WHERE ID_user = ? AND ID_subscribed = ?", [req.session.userID, IDUser]);
        await sqlQuery(res, "DELETE FROM notifications WHERE ID_user = ?", [IDUser]);
        res.status(200).json({message:"Subscription delete succeed", deleted:deleteResult.affectedRows});
    }
});

// update notifications settings
router.put("/update_subscription", [checkBody(["IDUser", "notifications"]),
    body("notifications").isWhitelisted(["all", "minimal", "none"]).withMessage("Is not match all, minimal or none")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDUser, notifications} = req.body;
    const updateResult = await sqlQuery(res, "UPDATE subscriptions SET notifications = ? WHERE ID_user = ? AND ID_subscribed = ?", [notifications, req.session.userID, IDUser]);
    res.status(200).json({message:"Subscription update succeed", updated:updateResult.affectedRows})
});



module.exports = router;