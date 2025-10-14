

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const { DateTime } = require("luxon");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();

/*
    Applications endpoints for app API
    endpoints related to mysql applications table
*/

router.get("/user_applications", checkQuery(["ID_user","name_filter"]), async (req, res) => {
    const {ID_user, name_filter} = req.query;
    const applicationsResult = await sqlQuery(res, "SELECT name, update_date, status, public, downloads FROM applications WHERE ID_user = ? AND name LIKE ?", [ID_user, `%${name_filter}%`]);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                update_date:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});


router.use(authorization());

router.get("/my_applications", checkQuery(["name_filter", "status_filter", "public_filter"]), async (req, res) => {
    // retrive user applications using filters
    const {name_filter, status_filter, public_filter} = req.query;
    let sqlString = "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, at.name as tag FROM applications a INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.ID_user = ?"
    const params = [req.session.userID];
    if(public_filter) {
        sqlString+=" AND a.public = ?";
        params.push(public_filter);
    }
    if(status_filter) {
        sqlString+=" AND a.status = ?";
        params.push(status_filter);
    }
    sqlString+=" AND a.name LIKE ?";
    params.push(`%${name_filter}%`);
    
    const applicationsResult = await sqlQuery(res, sqlString, params);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                update_date:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});


router.post("/upload_application", checkBody(["name", "description", "status"]), async (req, res) => {
    const {name, description, status} = req.body;
    await sqlQuery(res, "INSERT INTO applications() VALUES(?, ?, NULL, ?, ?, 0, 0, ?)", [nanoID.nanoid(), name, description, DateTime.now().toISO(), status, req.session.userID]);
    res.status(201).json({message:"Inserted successfully"});
});

router.post("/update_application", checkBody(["ID", "name", "description", "status"]), async (req, res) => {
    const {ID, name, description, status} = req.body;
    await sqlQuery(res, "UPDATE applications SET name = ?, description = ?, status = ? WHERE ID = ?", [name, description, status, ID]);
    res.status(200).json({message:"Updated successfully"});
});

module.exports = router;