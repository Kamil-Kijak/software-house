

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { DateTime } = require("luxon");
const { body, validationResult} = require("express-validator");

const router = express.Router();

// request opinions of the ID_application, filtered by username or rating
router.get("/opinions", [checkQuery(["IDApplication", "usernameFilter", "ratingFilter", "limit"]),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {IDApplication, usernameFilter, ratingFilter, limit} = req.query;
    let sqlString = "SELECT o.ID, o.rating, o.upload_date, o.comment, o.edited, u.username, u.ID as ID_user FROM opinions o INNER JOIN users u ON u.ID=o.ID_user WHERE ID_application = ? AND u.username LIKE ?";
    const params = [IDApplication, `%${usernameFilter}%`];
    if(ratingFilter) {
        if(ratingFilter == "ISC") {
            sqlString += " ORDER BY o.rating";
        } else {
            sqlString += " ORDER BY o.rating DESC";
        } 
    }
    sqlString+= " LIMIT ?";
    params.push(limit || "200");
    console.log(params)
    const opinionsResult = await sqlQuery(res, sqlString, params);
    res.status(200).json({message:"Retriviered opinions", opinions:opinionsResult});
});

router.use(authorization());

// request insert session user new opinion to the app
router.post("/insert_opinion", [checkBody(["IDApplication", "rating", "comment"]),
    body("rating").isInt({min:1, max:5}).withMessage("Must be a number between 1 and 5"),
    body("comment").trim().isLength({min:1, max:65535}).withMessage("Invalid text size")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDApplication, rating, comment} = req.body;
    const trimmedComment = comment.trim();
    // checking if this user opinion exist
    const opinionExistResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM opinions WHERE ID_user = ? AND ID_application = ?", [req.session.userID, IDApplication]);
    if(opinionExistResult[0].count == 0) {
        await sqlQuery(res, "INSERT INTO opinions() VALUES(?, ?, ?, ?, ?, 0, ?)", [nanoID.nanoid(), req.session.userID, IDApplication, rating, DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss"), trimmedComment]);
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(409).json({error:"This opinion is already exist!"});
    }
});

// request update session user opinion
router.put("/update_opinion", [checkBody(["IDOpinion", "rating", "comment"]),
    body("rating").isInt({min:1, max:5}).withMessage("Must be a number between 1 and 5"),
    body("comment").trim().isLength({min:1, max:65535}).withMessage("Invalid text size")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDOpinion, rating, comment} = req.body;
    const trimmedComment = comment.trim();
    const opinionOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM opinions WHERE ID_opinion = ? AND ID_user = ?", [IDOpinion, req.session.userID]);
    if(opinionOwnershipResult[0].count >= 1) {
        const updateResult = await sqlQuery(res, "UPDATE opinion SET rating = ?, comment = ?, upload_date = ?, edited = 1 WHERE ID = ?", [rating, trimmedComment, DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss"), IDOpinion]);
        res.status(200).json({message:"Update succeed", updated:updateResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// request opinion deletion using ID_opinion
router.delete("/delete_opinion", checkBody(["IDOpinion"]), async (req, res) => {
    const {IDOpinion} = req.body;
    const opinionOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM opinions WHERE ID_opinion = ? AND ID_user = ?", [IDOpinion, req.session.userID]);
    if(opinionOwnershipResult[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM opinions WHERE ID = ?", [IDOpinion]);
        res.status(200).json({message:"Deleted successfully", deleted:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});


module.exports = router;