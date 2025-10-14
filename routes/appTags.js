

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
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

router.post("/update_tag", checkBody(["ID_tag", "name"]), async (req, res) => {
    const {ID_tag, name} = req.body;
    await sqlQuery(res, "UPDATE app_tags SET name = ? WHERE ID = ?", [name, ID_tag]);
    res.status(200).json({message:"Updated successfully"});
});

router.delete("/delete_tag", checkBody(["ID_tag"]), async (req, res) => {
    const {ID_tag} = req.body;
    await sqlQuery(res, "DELETE FROM app_tags WHERE ID = ?", [ID_tag]);
    res.status(200).json({message:"Deleted successfully"});
});


module.exports = router;