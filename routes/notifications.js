
const express = require("express");
const cronTask = require("node-cron");
const {DateTime} = require("luxon");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");

const router = express.Router();


// sheduled deleting old notifications older than 90 days 
cronTask.schedule("0 0 1 * *", async () => {
    if(process.env.CONSOLE_LOGS) {
        console.log("Sheduled deleting old notifications in progress...");
    }
    const allNotificationsResult = await sqlQuery(res, "SELECT ID, send_date FROM notifications")
    const notificationsForDelete = allNotificationsResult.filter((obj) => {
        const date = DateTime.fromISO(obj.send_date);
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
router.get("/my_notifications", async (req, res) => {
    const notificationsResult = await sqlQuery(res, "SELECT ID, send_date, title, read, href FROM notifications WHERE ID_user = ?", [req.session.userID]);
    await sqlQuery(res, "UPDATE notifications SET read = 1 WHERE read = 0 AND ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retriviered notifications", notifications:notificationsResult});
});

// deleting one notification by ID notification
router.delete("/delete_one", checkBody(["ID_notification"]), async (req, res) => {
    const {ID_notification} = req.body;
    await sqlQuery(res, "DELETE FROM notifications WHERE ID_notification = ? AND ID_user = ?", [ID_notification, req.session.userID]);
    res.status(200).json({message:"delete one succeed"});
});
// delete all notifications of session user
router.delete("/delete_all", async (req, res) => {
    const deleteResult = await sqlQuery(res, "DELETE FROM notifications WHERE ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"delete all succeed", count:deleteResult.affectedRows});
});


module.exports = router;

