

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const { DateTime } = require("luxon");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();


router.use(authorization());


router.post("/upload_application", checkBody(["name", "description", "status"]), async (req, res) => {
    const {name, description, status} = req.body;
    await sqlQuery(res, "INSERT INTO applications() VALUES(?, ?, NULL, ?, ?, 0, ?)", [nanoID.nanoid(), name, description, DateTime.now().toISO(), status, req.session.userID]);
    res.status(201).json({message:"inserted successfully"});
});

router.post("/update_application", checkBody(["ID", "name", "description", "status"]), async (req, res) => {
    const {ID, name, description, status} = req.body;
    await sqlQuery(res, "UPDATE applications SET name = ?, description = ?, status = ? WHERE ID = ?", [name, description, status, ID]);
    res.status(200).json({message:"updated successfully"});
});

module.exports = router;