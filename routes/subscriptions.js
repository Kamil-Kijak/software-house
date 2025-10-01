
const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");

const authorization = require("../utils/authorization");

const router = express.Router();

router.get("/user_subscriptions/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscriptionsResult = await sqlQuery(res, "SELECT u.username, u.ID, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?", [ID]);
    res.status(200).json({message:"Retrivied successfully", subscriptions_data:subscriptionsResult});
});

router.get("/user_subscribers/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscribersResult = await sqlQuery(res, "SELECT u.username, u.ID FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?", [ID]);
    res.status(200).json({message:"Retrivied successfully", subscribers_data:subscribersResult});
});

router.use(authorization());

router.get("/my_subscriptions", async (req, res) => {
    const subscriptionsResult = await sqlQuery(res, "SELECT u.username, u.ID, s.notifications FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied successfully", subscriptions_data:subscriptionsResult});
});

router.get("/my_subscribers", async (req, res) => {
    const subscribersResult = await sqlQuery(res, "SELECT u.username, u.ID FROM subscriptions s INNER JOIN users u ON u.ID=s.ID_subscribed WHERE s.ID_subscribed = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied successfully", subscribers_data:subscribersResult});
});



module.exports = router;