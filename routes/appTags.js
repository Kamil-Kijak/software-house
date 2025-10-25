

const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { body, validationResult } = require("express-validator");

const router = express.Router();

const MAX_TAGS_PER_APP = 10;

/*
    AppTags endpoints for app API
    endpoints related to mysql app_tags table
*/


// request available tags filtered by name
router.get("/available_tags", checkQuery(["name", "limit"]), async (req, res) => {
    const {name, limit} = req.query;
    const availabletagsResult = await sqlQuery(res, "SELECT COUNT(ID) as count, name FROM app_tags WHERE name LIKE ? GROUP BY name LIMIT ?", [`${name}%`, limit || "200"]);
    res.status(200).json({message:"Available tags", tags:availabletagsResult})
});

router.use(authorization());

// request insertion many tags to specific application by ID_application
router.post("/insert_many", [checkBody(["IDApplication", "tags"]),
    body("tags").isArray().withMessage("Must be an array"),
    body("tags.*").trim().isLength({min:1, max:20}).withMessage("Must be length between 1 and 20")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDApplication, tags} = req.body;
    const appOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID_user = ? AND ID_application = ?", [req.session.userID, IDApplication]);
    if(appOwnershipResult[0].count >= 1) {
        const appTagsResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM app_tags WHERE ID_application = ?", [IDApplication]);
        const array = [...tags];
        if(Number(appTagsResult[0].count) + array.length > MAX_TAGS_PER_APP) {
            return res.status(400).json({error:"Too many tags"});
        }
        for(const element in array) {
            await sqlQuery(res, "INSERT INTO app_tags() VALUES(?, ?, ?)", [nanoID.nanoid(), element.trim(), IDApplication]);
        }
        res.status(201).json({massage:"Inserted many tags"});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

// request many tags updation using ID_tag in ID_tags
router.put("/update_many", [checkBody(["IDTags", "tags"]),
    body("IDTags").isArray().withMessage("Must be an array"),
    body("tags").isArray().withMessage("Must be an array"),
    body("tags.*").trim().isLength({min:1, max:20}).withMessage("Must be in length between 1 and 20")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDTags, tags} = req.body;
    const tagsIDArray = [...IDTags];
    const namesArray = [...tags];
    const tagsOwnership = await sqlQuery(res, `SELECT COUNT(at.ID) as count FROM app_tags at INNER JOIN applications a ON a.ID=at.ID_application WHERE a.ID_user = ? AND at.ID IN (${tagsIDArray.map(obj => '?').join(", ")})`, [req.session.userID, ...tagsIDArray]);
    if(tagsOwnership[0].count == tagsIDArray.length) {
        if(tagsIDArray.length != namesArray.length) {
            return res.status(400).json({error:"Lengths aren't the same values"});
        }
        let affectedRows = 0;
        for(let i = 0;i<tagsIDArray.length;i++) {
            const updateResult = await sqlQuery(res, "UPDATE app_tags SET name = ? WHERE ID = ?", [namesArray[i].trim(), tagsIDArray[i]]);
            affectedRows+= updateResult.affectedRows;
        }
        res.status(200).json({message:"Updated successfully", updated:affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

// request delete one tag using ID_tag
router.delete("/delete_tag", checkBody(["IDTag"]), async (req, res) => {
    const {IDTag} = req.body;
    const tagOwnership = await sqlQuery(res, "SELECT COUNT(at.ID) as count FROM app_tag at INNER JOIN applications a ON a.ID=at.ID_application WHERE a.ID_user = ?", [req.session.userID]);
    if(tagOwnership[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM app_tags WHERE ID = ?", [IDTag]);
        res.status(200).json({message:"Deleted successfully", deleted:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});


module.exports = router;