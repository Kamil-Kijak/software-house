
const express = require("express");
const {query, body, validationResult} = require("express-validator");
const sendNotification = require("../utils/sendNotification");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");

const authorization = require("../utils/authorization");
const User = require("../models/User");
const { Op } = require("sequelize");


const router = express.Router();

/*
    Subscriptions endpoints for app API
    endpoints related to mysql subscriptions table
*/


// request users subscribed by user with ID
router.get("/user_subscriptions/:ID", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {ID} = req.params;
    const {limit, usernameFilter} = req.query;
    const subscriptions = await Subscription.findAll({
        attributes:["notifications"],
        include:{
            model:User,
            as:"subscribed",
            attributes:["id", "username", "profileDescription"],
            where:{
                username:{
                    [Op.like]:`%${usernameFilter}%`
                }
            }
        },
        where:{
            idUser:ID
        },
        ...(limit ? { limit:limit } : {limit:200})
    });
    res.status(200).json({message:"Retrivied successfully", subscriptions});
});


// request users which subscribe user with ID
router.get("/user_subscribers/:ID", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {ID} = req.params;
    const {limit, usernameFilter} = req.query;
    const subscribers = await Subscription.findAll({
        attributes:["notifications"],
        include:{
            model:User,
            as:"subscriber",
            attributes:["id", "username", "profileDescription"],
            where:{
                username:{
                    [Op.like]:`%${usernameFilter}%`
                }
            }
        },
        where:{
            idSubscribed:ID
        },
        ...(limit ? { limit:limit } : {limit:200})
    });
    res.status(200).json({message:"Retrivied successfully", subscribers});
});

router.use(authorization());

// requesting data about user subscribed, subscription notifications
router.get("/subscriptions_data/:ID", async (req, res) => {
    const {ID} = req.params;
    const subscribe = await Subscription.count({where:{idSubscribed:req.session.userID, idUser:ID}});
    const subscribed = await Subscription.count({where:{idSubscribed:req.session.userID, idUser:ID}});
    const subcribedNotifications = await Subscription.findOne({
        attributes:["notifications"],
        where:{
            idSubscribed:ID,
            idUser:req.session.userID
        }
    })
    res.status(200).json({
        message:"Retriviered user subscriptions data",
        subscribe,
        subscribed,
        subcribedNotifications
    });
});

// request users subscribed by session user
router.get("/my_subscriptions", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const {usernameFilter, limit} = req.query;
    const subcriptions = await Subscription.findAll({
        attributes:["notifications"],
        include:{
            model:User,
            as:"subscribed",
            attributes:["id", "username", "profileDescription"],
            where:{
                username:{
                    [Op.like]:`%${usernameFilter}%`
                }
            }
        },
        where:{
            idUser:req.session.userID
        },
        ...(limit ? { limit:limit } : {limit:200})
    });
    res.status(200).json({message:"Retrivied successfully", subcriptions});
});

// request users which subscribe session user
router.get("/my_subscribers", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {limit, usernameFilter} = req.query;
    const subscribers = await Subscription.findAll({
        attributes:["notifications"],
        include:{
            model:User,
            as:"subscriber",
            attributes:["id", "username", "profileDescription"],
            where:{
                username:{
                    [Op.like]:`%${usernameFilter}%`
                }
            }
        },
        where:{
            idSubscribed:req.session.userID
        },
        ...(limit ? { limit:limit } : {limit:200})
    });
    res.status(200).json({message:"Retrivied successfully", subscribers});
});

// toggling subscription
router.post("/toggle_subscription", [
    body("idUser").exists({checkFalsy:true}).withMessage("idUser is required")
], async (req, res) => {
    const {idUser} = req.body;
    const subcriptionCount = await Subscription.count({where:{idUser:req.session.userID,idSubcribed:idUser}})
    if(subcriptionCount == 0) {
        // if subscription don't exist
        await Subscription.create({
            idUser:req.session.userID,
            idSubscribed:idUser
        })
        // sending notification
        const userResult = await User.findByPk(req.session.userID, {attributes:["username"]});
        await sendNotification(res, `User ${userResult.username} is now subscribing you`, null, idUser);
        res.status(201).json({message:"New subscription Created"});
    } else {
        const affectedRows = await Subscription.destroy({where:{idUser:req.session.userID, idSubcribed:idUser}})
        await Notification.destroy({where:{idUser}})
        res.status(200).json({message:"Subscription delete succeed", affectedRows});
    }
});

// update notifications settings
router.put("/update_subscription", [
    body("idUser").exists({checkFalsy:true}).withMessage("idUser is required"),
    body("notifications").exists({checkFalsy:true}).withMessage("notifications is required").isWhitelisted(["all", "minimal", "none"]).withMessage("notifications is not correct")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idUser, notifications} = req.body;
    const [affectedRows] = await Subscription.update({notifications}, {where:{idUser:req.session.userID,idSubcribed:idUser}});
    res.status(200).json({message:"Subscription update succeed", affectedRows});
});



module.exports = router;