

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");

const router = express.Router();

const MAX_TAGS_PER_APP = 10;

/*
    AppTags endpoints for app API
    endpoints related to mysql app_tags table
*/


// request available tags filtered by name
router.get("/available_tags", checkQuery(["name"]), async (req, res) => {
    const {name} = req.query;
    const availabletagsResult = await sqlQuery(res, "SELECT COUNT(ID) as count, name FROM app_tags WHERE name LIKE ? GROUP BY name", [`${name}%`]);
    res.status(200).json({message:"Available tags", tags:availabletagsResult})
});

router.use(authorization());

// request insertion many tags to specific application by ID_application
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

// request many tags updation using ID_tag in ID_tags
router.post("/update_many", checkBody(["ID_tags", "name"]), async (req, res) => {
    const {ID_tags, names} = req.body;
    const tagsIDArray = [...ID_tags];
    const namesArray = [...names];
    if(tagsIDArray.length != namesArray.length) {
        return res.status(400).json({error:"Lengths aren't the same values"});
    }
    for(let i = 0;i<tagsIDArray.length;i++) {
        await sqlQuery(res, "UPDATE app_tags SET name = ? WHERE ID = ?", [namesArray[i], tagsIDArray[i]]);
    }
    res.status(200).json({message:"Updated successfully"});
});

// request delete one tag using ID_tag
router.delete("/delete_tag", checkBody(["ID_tag"]), async (req, res) => {
    const {ID_tag} = req.body;
    await sqlQuery(res, "DELETE FROM app_tags WHERE ID = ?", [ID_tag]);
    res.status(200).json({message:"Deleted successfully"});
});


module.exports = router;