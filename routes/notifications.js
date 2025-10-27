
const express = require("express");
const cronTask = require("node-cron");
const {DateTime} = require("luxon");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();


// sheduled deleting old notifications older than 90 days 
cronTask.schedule("0 0 1 * *", async () => {
    if(process.env.CONSOLE_LOGS) {
        console.log("Sheduled deleting old notifications in progress...");
    }
    const allNotificationsResult = await sqlQuery(res, "SELECT ID, send_date FROM notifications")
    const notificationsForDelete = allNotificationsResult.filter((obj) => {
        const date = DateTime.fromSQL(obj.send_date, { zone: "utc" });
        if(DateTime.now().diff(date, ["days"]).toObject().days > 30 * 3) {
            return true;
        } else {
            return false;
        }
    });
    const deleteResult = await sqlQuery(res, `DELETE FROM notifications WHERE ID IN (${notificationsForDelete.map(obj => "?").join(",")})`, notificationsForDelete.map((obj) => obj.ID));
    if(process.env.CONSOLE_LOGS) {
        console.log(`Delete succeed. Deleted notifications: ${deleteResult.affectedRows}`);
    }
});

/*
    Notifications endpoints for app API
    endpoints related to mysql notifications table
*/

router.use(authorization());

// requesting all notifications of session user
router.get("/my_notifications", checkQuery(["limit"]), async (req, res) => {
    const {limit} = req.query;
    const notificationsResult = await sqlQuery(res, "SELECT ID, send_date, title, read, href FROM notifications WHERE ID_user = ? LIMIT ?", [req.session.userID, limit || "200"]);
    await sqlQuery(res, "UPDATE notifications SET read = 1 WHERE read = 0 AND ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retriviered notifications", notifications:notificationsResult});
});

// deleting one notification by ID notification
router.delete("/delete_one", checkBody(["IDNotification"]), async (req, res) => {
    const {IDNotification} = req.body;
    const notificationOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM notifications WHERE ID_notification = ? AND ID_user = ?", [IDNotification, req.session.userID]);
    if(notificationOwnershipResult[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM notifications WHERE ID_notification = ?", [IDNotification]);
        res.status(200).json({message:"delete one succeed", deleted:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});
// delete all notifications of session user
router.delete("/delete_all", async (req, res) => {
    const deleteResult = await sqlQuery(res, "DELETE FROM notifications WHERE ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"delete all succeed", count:deleteResult.affectedRows});
});


module.exports = router;

