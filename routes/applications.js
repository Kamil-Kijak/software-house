

const express = require("express");
const nanoID = require("nanoid");
const path = require("path");
const fs = require("fs");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const {appImageUpload, appFileUpload} = require("../utils/multerUploads");
const { DateTime } = require("luxon");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();

/*
    Applications endpoints for app API
    endpoints related to mysql applications table
*/

router.get("/app_image", checkQuery(["ID"]), async (req, res) => {
    const {ID} = req.query;
    const IDuserResult = await sqlQuery(res, "SELECT ID_user FROM applications WHERE ID = ?", [ID]);
    const filePath = path.join(process.cwd(), "files", `${IDuserResult[0].ID_user}`, "apps", `${ID}`);
    const directory = fs.readdirSync(filePath);
    const image = directory.find((obj) => obj.startsWith("app."));
    res.status(200).sendFile(path.join(filePath, image));
});

router.get("/app_data", checkQuery(["ID_app"]), async (req, res) => {
    const {ID_app} = req.query;
    const infoResult = await sqlQuery(res, "SELECT name, description, status, public, downloads, app_file FROM applications WHERE ID = ?", [ID_app]);
    const tagsResult = await sqlQuery(res, "SELECT name FROM app_tags WHERE ID_application = ?", [ID_app]);
    const tagsArray = tagsResult.map((obj) => obj.name);
    const screensResult = await sqlQuery(res, "SELECT ID, description FROM app_screens WHERE ID_application = ?", [ID_app]);
    res.status(200).json({message:"Retriviered app data", application:{
        ...infoResult[0],
        tags:tagsArray,
        screens:screensResult
    }});
});

router.get("/user_applications", checkQuery(["ID_user","name_filter"]), async (req, res) => {
    const {ID_user, name_filter} = req.query;
    const applicationsResult = await sqlQuery(res, "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag FROM applications a INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.ID_user = ? AND a.name LIKE ?", [ID_user, `%${name_filter}%`]);
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
                description:obj.description,
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
    let sqlString = "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag FROM applications a INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.ID_user = ?"
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
                description:obj.description,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});

router.post("/upload_app_image", appImageUpload.single("file"), async (req, res) => {
    // require req.body.ID_application
    if(req.file) {
        await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.now().toISO(), req.body.ID_application]);
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});

router.post("/upload_app_file", appFileUpload.single("file"), async (req, res) => {
    // require req.body.ID_application
    const {ID_application} = req.body;
    if(req.file) {
        await sqlQuery(res, "UPDATE applications SET app_file = ?, update_date = ? WHERE ID = ?", [req.file.filename, DateTime.now().toISO(), ID_application]);
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});


router.post("/upload_application", checkBody(["name", "description", "status"]), async (req, res) => {
    const {name, description, status} = req.body;
    await sqlQuery(res, "INSERT INTO applications() VALUES(?, ?, NULL, ?, ?, 0, 0, ?)", [nanoID.nanoid(), name, description, DateTime.now().toISO(), status, req.session.userID]);
    res.status(201).json({message:"Inserted successfully"});
});

router.post("/update_application", checkBody(["ID", "name", "description", "status"]), async (req, res) => {
    const {ID, name, description, status} = req.body;
    await sqlQuery(res, "UPDATE applications SET name = ?, description = ?, status = ?, update_date = ? WHERE ID = ?", [name, description, status, DateTime.now().toISO(), ID]);
    res.status(200).json({message:"Updated successfully"});
});

module.exports = router;