
const {DateTime} = require("luxon");

const Notification = require("../models/Notification");

const sendNotification = async (res, title, href = null, ID_user) => {
    try {
        await Notification.create({
            send_date:DateTime.utc().toJSDate(),
            title,
            href,
            ID_user
        });
    } catch (err) {
        res.status(500).json({error:"Sending notification error"});
    }
}

module.exports = sendNotification;