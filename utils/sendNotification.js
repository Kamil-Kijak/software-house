
const {DateTime} = require("luxon");
const nanoID = require("nanoid");
const sqlQuery = require("../utils/mysqlQuery");

const sendNotification = async (res, title, href = null, ID_user) => {
    await sqlQuery(res, "INSERT INTO notifications() VALUES(?, ?, ?, ?)",
         [nanoID.nanoid(), DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss"), title, false, href, ID_user]);
}

module.exports = sendNotification;