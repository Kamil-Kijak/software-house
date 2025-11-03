
const express = require("express");
const cronTask = require("node-cron");
const {DateTime} = require("luxon");

const authorization = require("../utils/authorization");

const Notification = require("../models/Notification");
const { Op } = require("sequelize");
const { query, body } = require("express-validator");

const router = express.Router();


// sheduled deleting old notifications older than 90 days 
cronTask.schedule("0 0 1 * *", async () => {
    if(Number(process.env.CONSOLE_LOGS)) {
        console.log("Sheduled deleting old notifications in progress...");
    }
    const affectedRows = await Notification.destroy({
        where:{
            sendDate:{
                [Op.lt]:DateTime.utc().minus({days:90}).toJSDate()
            }
        }
    })
    if(Number(process.env.CONSOLE_LOGS)) {
        console.log(`Delete succeed. Deleted notifications: ${affectedRows}`);
    }
});

/*
    Notifications endpoints for app API
    endpoints related to mysql notifications table
*/

router.use(authorization());

// requesting all notifications of session user
router.get("/my_notifications", [
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {limit} = req.query;

    const notifications = await Notification.findAll({
        attributes:["id", "sendDate", "title", "read", "href"],
        where:{
            idUser:req.session.userID
        },
        ...(limit ? {limit} : {limit:200})
    });

    await Notification.update({read:true}, {where:{read:false, idUser:req.session.userID}});
    res.status(200).json({message:"Retriviered notifications", notifications});
});

// deleting one notification by ID notification
router.delete("/delete_one", [
    body("idNotification").exists({checkFalsy:true}).withMessage("idNotification is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idNotification} = req.body;
    const notificationOwnership = await Notification.count({where:{id:idNotification, idUser:req.session.userID}});
    if(notificationOwnership >= 1) {
        const affectedRows = await Notification.destroy({where:{id:idNotification}});
        res.status(200).json({message:"delete one succeed", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});
// delete all notifications of session user
router.delete("/delete_all", async (req, res) => {
    const affectedRows = await Notification.destroy({where:{idUser:req.session.userID}});
    res.status(200).json({message:"delete all succeed", affectedRows});
});


module.exports = router;

