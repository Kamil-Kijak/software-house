

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const { DateTime } = require("luxon");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();

const MAX_TAGS_PER_APP = 10;


router.get("/available_tags", checkQuery(["name"]), async (req, res) => {
    const {name} = req.query;
    const availabletagsResult = await sqlQuery(res, "SELECT COUNT(ID) as count, name FROM app_tags WHERE name LIKE ? GROUP BY name", [`${name}%`]);
    res.status(200).json({message:"Available tags", tags:availabletagsResult})
});

router.use(authorization());

router.post("/insert_many", checkBody(["ID_application", "tags"]), async (req, res) => {
    const {ID_application, tags} = req.body;
    const appTagsResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM app_tags WHERE ID_application = ?", [ID_application]);
    const array = [...tags];
    if(Number(appTagsResult[0].count) + array.length > MAX_TAGS_PER_APP) {
        return res.status(400).json({error:"Too many tags"});
    }
    for(const element in array) {
        await sqlQuery(res, "INSERT INTO app_tags() VALUES(?, ?, ?)", [nanoID.nanoid(), element, ID_application]);
    }
    res.status(201).json({massage:"Inserted many tags"});
});

router.post("/update_many", checkBody(["ID_tags", "names"]), async (req, res) => {
    const {ID_tags, names} = req.body;
    const IDArray = [...ID_tags];
    const namesArray = [...names];
    if(IDArray.length != namesArray.length) {
        return res.status(400).json({error:"Arrays don't match with length. There aren't the same"})
    }
    for (let i = 0;i<IDArray.length;i++) {
        await sqlQuery(res, "UPDATE app_tags SET name = ? WHERE ID = ?", [IDArray[i], namesArray[i]]);
    }
    res.status(200).json({message:"Updated many"});
});

router.delete("/delete_many", checkBody(["ID_tags"]), async (req, res) => {
    const {ID_tags} = req.body;
    const IDArray = [...ID_tags];
    for(const ID in IDArray) {
        await sqlQuery(res, "DELETE FROM app_tags WHERE ID = ?", [ID]);
    }
    res.status(200).json({message:"Deleted successfully"});
});


module.exports = router;