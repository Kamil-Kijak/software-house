


const express = require("express");

const authorization = require("../utils/authorization");
const { body, validationResult } = require("express-validator");

const SocialLink = require("../models/SocialLink");

const router = express.Router();

// Constants

const MAX_LINKS_PER_USER = 5;

/*
    Social links endpoints for app API
    endpoints related to mysql social links table
*/


router.use(authorization());

// request social links of session user
router.get("/my_links", async (req, res) => {
    const socialLinks = await SocialLink.findAll({attributes:["id", "name", "href"], where:{idUser:req.session.userID}})
    res.status(200).json({message:"Retrivied socials links", socialLinks});
});


// adding new link to session user
router.post("/insert_link", [
    body("name").trim().exists({checkFalsy:true}).withMessage("name is required").isLength({max:25}).withMessage("name max length: 25"),
    body("href").trim().exists({checkFalsy:true}).withMessage("href is required").isLength({max:255}).withMessage("href max length: 255")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, href} = req.body;
    const trimmedName = name.trim();
    const trimmedHref = href.trim();
    const socialLinksCount = await SocialLink.count({where:{idUser:req.session.userID}});
    // checking user's social links count limit
    if(socialLinksCount <= MAX_LINKS_PER_USER) {
        await SocialLink.create({
            name:trimmedName,
            href:trimmedHref,
            idUser:req.session.userID
        });
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(400).json({error:"Too many social links for this user"});
    }
});

// update session user link by link ID
router.put("/update_link", [
    body("idLink").exists({checkFalsy:true}).withMessage("idLink is required"),
    body("name").trim().exists({checkFalsy:true}).withMessage("name is required").isLength({max:25}).withMessage("name max length: 25"),
    body("href").trim().exists({checkFalsy:true}).withMessage("href is required").isLength({max:255}).withMessage("href max length: 255")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idLink, name, href} = req.body;
    const trimmedName = name.trim();
    const trimmedHref = href.trim();
    const linkOwnership = await SocialLink.count({where:{idUser:req.session.userID, id:idLink}});
    if(linkOwnership >= 1) {
        const [affectedRows] = await SocialLink.update({name:trimmedName, href:trimmedHref}, {where:{id:idLink}})
        res.status(200).json({message:"Update succeed", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// delete session user link
router.delete("/delete_link", [
    body("idLink").exists({checkFalsy:true}).withMessage("idLink is required")
], async (req, res) => {
    const {idLink} = req.body;
    const linkOwnership = await SocialLink.count({where:{idUser:req.session.userID, id:idLink}});
    if(linkOwnership >= 1) {
        const affectedRows = await SocialLink.destroy({where:{id:idLink}});
        res.status(200).json({message:"Delete succeed", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});




module.exports = router;