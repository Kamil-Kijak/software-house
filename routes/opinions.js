

const express = require("express");

const authorization = require("../utils/authorization");
const { DateTime } = require("luxon");
const { body, validationResult, query} = require("express-validator");
const Opinion = require("../models/Opinion");
const User = require("../models/User");
const { Op } = require("sequelize");

const router = express.Router();

// request opinions of the ID_application, filtered by username or rating
router.get("/get_opinions", [
    query("idApplication").exists({checkFalsy:false}).withMessage("idApplication is required"),
    query("ratingFilter").exists().withMessage("ratingFilter is required").isWhitelisted(["ASC", "DESC"]).withMessage("ratingFilter can be ASC or DESC"),
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {idApplication, usernameFilter, ratingFilter, limit} = req.query;
    const opinions = await Opinion.findAll({
        attributes:["id", "rating", "uploadDate", "comment", "edited"],
        include:{
            model:User,
            as:"user",
            attributes:["id"],
            where:{
                username:{
                    [Op.like]: `%${usernameFilter}%`
                }
            }
        },
        where:{
            idApplication:idApplication
        },
        ...(ratingFilter && {order:[["rating", ratingFilter === "ASC" ? "ASC" : "DESC"]]}),
        ...(limit ? {limit} : {limit:200})
    });
    res.status(200).json({message:"Retriviered opinions", opinions});
});

router.use(authorization());

// request insert session user new opinion to the app
router.post("/insert_opinion", [
    body("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required"),
    body("rating").exists({checkFalsy:true}).withMessage("rating is required").isInt({min:1, max:5}).withMessage("rating between 1-5"),
    body("comment").trim().exists({checkFalsy:true}).withMessage("comment is required").isLength({min:1, max:65535}).withMessage("comment length between 1-65535")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {idApplication, rating, comment} = req.body;
    const trimmedComment = comment.trim();
    // checking if this user opinion exist
    const opinionCount = await Opinion.count({where:{idUser:req.session.userID, idApplication}});
    if(opinionCount == 0) {
        await Opinion.create({
            idUser:req.session.userID,
            idApplication,
            rating,
            uploadDate:DateTime.utc().toJSDate(),
            comment:trimmedComment
        });
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(409).json({error:"This opinion is already exist!"});
    }
});

// request update session user opinion
router.put("/update_opinion", [
    body("idOpinion").exists({checkFalsy:true}).withMessage("idOpinion is required"),
    body("rating").exists({checkFalsy:true}).withMessage("rating is required").isInt({min:1, max:5}).withMessage("rating between 1-5"),
    body("comment").trim().exists({checkFalsy:true}).withMessage("comment is required").isLength({min:1, max:65535}).withMessage("comment length between 1-65535")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {idOpinion, rating, comment} = req.body;
    const trimmedComment = comment.trim();

    const opinionOwnership = await Opinion.count({where:{idOpinion, idUser:req.session.userID}});
    if(opinionOwnership >= 1) {
        const [affectedRows] = await Opinion.update({rating, comment:trimmedComment, uploadDate:DateTime.utc().toJSDate(), edited:true}, {where:{id:idOpinion}})
        res.status(200).json({message:"Update succeed", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// request opinion deletion using ID_opinion
router.delete("/delete_opinion", [
    body("idOpinion").exists({checkFalsy:true}).withMessage("idOpinion is required"),
], async (req, res) => {
    const {idOpinion} = req.body;
    const opinionOwnership = await Opinion.count({where:{idOpinion, idUser:req.session.userID}});
    if(opinionOwnership >= 1) {
        const affectedRows = await Opinion.destroy({where:{id:idOpinion}})
        res.status(200).json({message:"Deleted successfully", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});


module.exports = router;