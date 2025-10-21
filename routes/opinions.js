

const express = require("express");
const nanoID = require("nanoid");
const path = require("path");
const fs = require("fs");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { DateTime } = require("luxon");

const router = express.Router();

// request opinions of the ID_application, filtered by username or rating
router.get("/opinions", checkQuery(["ID_application", "username_filter", "rating_filter"]), async (req, res) => {
    const {ID_application, username_filter, rating_filter} = req.query;
    let sqlString = "SELECT o.ID, o.rating, o.upload_date, o.comment, o.edited, u.username, u.ID as ID_user FROM opinions o INNER JOIN users u ON u.ID=o.ID_user WHERE ID_application = ? AND u.username LIKE ?";
    const params = [ID_application, `%${username_filter}%`];
    if(rating_filter) {
        if(rating_filter == "ISC") {
            sqlString += " ORDER BY o.rating";
        } else {
            sqlString += " ORDER BY o.rating DESC";
        } 
    }
    const opinionsResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retriviered opinions", opinions:opinionsResult});
});

router.use(authorization());

// request insert session user new opinion to the app
router.post("/insert", checkBody(["ID_application", "rating", "comment"]), async (req, res) => {
    const {ID_application, rating, comment} = req.body;
    // checking if this user opinion exist
    const opinionExistResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM opinions WHERE ID_user = ? AND ID_application = ?", [req.session.userID, ID_application]);
    if(opinionExistResult[0].count == 0) {
        await sqlQuery(res, "INSERT INTO opinions() VALUES(?, ?, ?, ?, ?, 0, ?)", [nanoID.nanoid(), req.session.userID, ID_application, rating, DateTime.now().toISO(), comment]);
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(409).json({error:"This opinion is already exist!"});
    }
});

// request update session user opinion
router.post("/update", checkBody(["ID_opinion", "rating", "comment"]), async (req, res) => {
    const {ID_opinion, rating, comment} = req.body;
    await sqlQuery(res, "UPDATE opinion SET rating = ?, comment = ?, upload_date = ?, edited = 1 WHERE ID = ?", [rating, comment, DateTime.now().toISO(), ID_opinion]);
    res.status(200).json({message:"Update succeed"});
});

// request opinion deletion using ID_opinion
router.delete("/delete", checkBody(["ID_opinion"]), async (req, res) => {
    const {ID_opinion} = req.body;
    await sqlQuery(res, "DELETE FROM opinions WHERE ID = ?", [ID_opinion]);
    res.status(200).json({message:"Deleted successfully"});
});


module.exports = express;