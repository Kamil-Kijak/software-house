
const express = require("express");
const nanoID = require("nanoid");
const {DateTime} = require("luxon");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const sendNotification = require("../utils/sendNotification");

const authorization = require("../utils/authorization");

const router = express.Router();

/*
    Subscriptions endpoints for app API
    endpoints related to mysql subscriptions table
*/

router.get("/user_subscriptions/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscriptionsResult = await sqlQuery(res, "SELECT u.username, u.ID, u.profile_description, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?", [ID]);
    res.status(200).json({message:"Retrivied successfully", subscriptions_data:subscriptionsResult});
});

router.get("/user_subscribers/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscribersResult = await sqlQuery(res, "SELECT u.username, u.ID, u.profile_description FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?", [ID]);
    res.status(200).json({message:"Retrivied successfully", subscribers_data:subscribersResult});
});

router.use(authorization());

router.get("/subscriptions_data/:ID", async (req, res) => {
    // endpoint for get data about, is this user is subscribed by me or is I subscribe this user
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

router.get("/my_subscriptions", async (req, res) => {
    const subscriptionsResult = await sqlQuery(res, "SELECT u.username, u.ID, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied successfully", subscriptions_data:subscriptionsResult});
});

router.get("/my_subscribers", async (req, res) => {
    const subscribersResult = await sqlQuery(res, "SELECT u.username, u.ID FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied successfully", subscribers_data:subscribersResult});
});

router.post("/toggle_subscription", checkBody(["ID_user"]), async (req, res) => {
    const {ID_user} = req.body;
    const subscriptionExistResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM subscriptions WHERE ID_user = ? AND ID_subscribed = ?", [req.session.userID, ID_user]);
    if(subscriptionExistResult[0].count == 0) {
        // if subscription don't exist
        await sqlQuery(res, "INSERT INTO subscriptions() VALUES(?, ?, ?, ?)", [nanoID.nanoid(), req.session.userID, ID_user, "all"]);
        // sending notification
        const userResult = await sqlQuery(res, "SELECT username FROM users WHERE ID = ?", [req.session.userID]);
        await sendNotification(res, `User ${userResult[0].username} is now subscribing you`, null, ID_user);
        res.status(201).json({message:"New subscription Created"});
    } else {
        await sqlQuery(res, "DELETE FROM subscriptions WHERE ID_user = ? AND ID_subscribed = ?", [req.session.userID, ID_user]);
        await sqlQuery(res, "DELETE FROM notifications WHERE ID_user = ?", [ID_user]);
        res.status(200).json({message:"Subscription delete succeed"});
    }
});

router.post("/update_subscription", checkBody(["ID_user", "notifications"]), async (req, res) => {
    const {ID_user, notifications} = req.body;
    await sqlQuery(res, "UPDATE subscriptions SET notifications = ? WHERE ID_user = ? AND ID_subscribed = ?", [notifications, req.session.userID, ID_user]);
    res.status(200).json({message:"Subscription update succeed"})
});



module.exports = router;