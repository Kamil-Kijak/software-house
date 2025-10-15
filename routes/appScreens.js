

const express = require("express");
const path = require("path");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { appScreensUpload } = require("../utils/multerUploads");

const router = express.Router();

router.use(authorization());

router.post("/upload_app_screens", appScreensUpload.array("files"), async (req, res) => {
    if(req.files) {
        const mappedFiles = req.files.map((obj) => obj.fileName);
        res.status(200).json({message:"Uploaded successfully", screens:mappedFiles});
    } else {
        res.status(400).json({error:"Uploading failed"});
    }
});

router.post("/insert_many", checkBody(["ID_application", "ID_screens", "descriptions"]), async (req, res) => {
    const {ID_application, ID_screens, descriptions} = req.body;
    const IDArray = [...ID_screens];
    const descriptionsArray = [...descriptions];
    if(IDArray.length == descriptionsArray.length) {
        return res.status(400).json({error:"Lengths aren't the same values"});
    }
    for(let i = 0;i<IDArray.length;i++) {
        await sqlQuery(res, "INSERT INTO app_screens() VALUES(?, ?, ?)", [IDArray[i], descriptionsArray[i], ID_application]);
    }
    res.status(201).json({message:"Inserted successfully"});
});

router.delete("/delete", checkBody(["ID_screen"]), async (req, res) => {
    const {ID_screen} = req.body;
    await sqlQuery(res, "DELETE FROM app_screens WHERE ID = ?", [ID_screen]);
    res.status(200).json({message:"Deleted successfully"});
});

module.exports = router;