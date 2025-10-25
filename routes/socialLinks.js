


const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");

const authorization = require("../utils/authorization");
const { body, validationResult } = require("express-validator");

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
    const socialLinksResult = await sqlQuery(res, "SELECT ID, name, href FROM social_links WHERE ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied socials links", socialLinks:socialLinksResult});
});


// adding new link to session user
router.post("/insert_link", [checkBody(["name", "href"]),
    body("name").trim().isLength({max:25}).withMessage("Is too long"),
    body("href").trim().isLength({max:255}).withMessage("Is too long")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, href} = req.body;
    const trimmedName = name.trim();
    const trimmedHref = href.trim();
    const socialLinkCountResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ?", [req.session.userID]);
    // checking user's social links count limit
    if(socialLinkCountResult[0].count <= MAX_LINKS_PER_USER) {
        await sqlQuery(res, "INSERT INTO social_links() VALUES(?, ?, ?, ?)", [nanoID.nanoid(), trimmedName, trimmedHref, req.session.userID]);
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(400).json({error:"Too many social links for this user"});
    }
});

// update session user link by link ID
router.put("/update_link", [checkBody(["IDLink", "name", "href"]),
    body("name").trim().isLength({max:25}).withMessage("Is too long"),
    body("href").trim().isLength({max:255}).withMessage("Is too long")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDLink, name, href} = req.body;
    const trimmedName = name.trim();
    const trimmedHref = href.trim();
    const linkOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ? AND ID = ?", [req.session.userID, IDLink]);
    if(linkOwnershipResult[0].count >= 1) {
        const updateResult = await sqlQuery(res, "UPDATE social_links SET name = ?, href = ? WHERE ID = ?", [trimmedName, trimmedHref, IDLink]);
        res.status(200).json({message:"Update succeed", updated:updateResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// delete session user link
router.delete("/delete_link", checkBody(["IDLink"]), async (req, res) => {
    const {IDLink} = req.body;
    const linkOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ? AND ID = ?", [req.session.userID, IDLink]);
    if(linkOwnershipResult[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM social_links WHERE ID = ?", [IDLink]);
        res.status(200).json({message:"Delete succeed", deleted:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});




module.exports = router;