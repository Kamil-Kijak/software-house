

const express = require("express");

const authorization = require("../utils/authorization");
const { body, validationResult, query } = require("express-validator");

const AppTag = require("../models/AppTag");
const { Sequelize, Op } = require("sequelize");
const Application = require("../models/Application");

const router = express.Router();

const MAX_TAGS_PER_APP = 10;

/*
    AppTags endpoints for app API
    endpoints related to mysql app_tags table
*/


// request available tags filtered by name
router.get("/available_tags", [
    query("name").exists({checkFalsy:true}).withMessage("name is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, limit} = req.query;
    const tags = await AppTag.findAll({
        attributes: [
            "name",
            [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
        ],
        where: {
        name: {
            [Op.like]: `%${name}%`
        }
        },
        group: ["name"],
        ...(limit ? { limit:limit } : {limit:200})
  });
    res.status(200).json({message:"Available tags", tags})
});

router.use(authorization());

// request insertion many tags to specific application by ID_application
router.post("/insert_many", [
    body("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required"),
    body("tags").exists({checkFalsy:true}).withMessage("tags is required").isArray().withMessage("tags type: array"),
    body("tags.*").trim().isLength({min:1, max:20}).withMessage("tag in tags length between 1 and 20")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication, tags} = req.body;
    const appOwnership = await Application.count({where:{idUser:req.session.userID, idApplication}});
    if(appOwnership >= 1) {
        const appTagsCount = await AppTag.count({where:{idApplication}})
        const array = [...tags];
        if(Number(appTagsCount) + array.length > MAX_TAGS_PER_APP) {
            return res.status(400).json({error:"Too many tags"});
        }
        for(const element in array) {
            await AppTag.create({name:element.trim(), idApplication})
        }
        res.status(201).json({massage:"Inserted many tags successfully"});
    } else {
        res.status(403).json({error:"You don't have permission for insertion to this resource"});
    }
});

// request many tags updation using ID_tag in ID_tags
router.put("/update_many", [
    body("idTags").exists({checkFalsy:true}).withMessage("idTags is required").isArray().withMessage("idTags type: array"),
    body("tagsNames").exists().isArray().withMessage("tagsNames"),
    body("tagsNames.*").trim().isLength({min:1, max:20}).withMessage("Must be in length between 1 and 20")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idTags, tagsNames} = req.body;
    const tagsIdArray = [...idTags];
    const tagsNamesArray = [...tagsNames];
    const tagsOwnership = await AppTag.count({
        where:{
            id:{
                [Op.in]:tagsIdArray
            }
        },
        include:{
            model:Application,
            as:"application",
            where:{
                idUser:req.session.userID
            }
        }
    });
    if(tagsOwnership == tagsIdArray.length) {
        if(tagsIdArray.length != tagsNamesArray.length) {
            return res.status(400).json({error:"Lengths aren't the same values"});
        }
        let affectedRowsSum = 0;
        for(let i = 0;i<tagsIdArray.length;i++) {
            const [affectedRows] = AppTag.update({name:tagsNamesArray[i].trim()}, {where:{id:tagsIdArray[i]}})
            affectedRowsSum+= affectedRows
        }
        res.status(200).json({message:"Updated successfully", affectedRows: affectedRowsSum});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// request delete one tag using ID_tag
router.delete("/delete_tag", [
    body("idTag").exists({checkFalsy:true}).withMessage("idTag is required")
], async (req, res) => {
    const {idTag} = req.body;
    const tagOwnership = await AppTag.count({
        where:{
            id:idTag
        },
        include:{
            model:Application,
            as:"application",
            where:{
                idUser:req.session.userID
            }
        }
    });
    if(tagOwnership >= 1) {
        const affectedRows = await AppTag.destroy({where:{id:idTag}})
        res.status(200).json({message:"Deleted successfully", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});


module.exports = router;