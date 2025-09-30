


const express = require("express");
const nanoID = require("nanoid");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");

const authorization = require("../utils/authorization");

const router = express.Router();

// Constants

const MAX_LINKS_PER_USER = 5;

/*
    Social links endpoints for app API
    endpoints related to mysql social links table
*/


router.use(authorization());

router.get("/my_links", async (req, res) => {
    // returns actual logged user social links
    const userLinksResult = await sqlQuery(res, "SELECT name, href FROM social_links WHERE ID_user = ?", [req.session.userID]);
    res.status(200).json({message:"Retrivied socials links", user_social_links:userLinksResult});
});

router.post("/insert_link", checkBody(["name", "href"]), async (req, res) => {
    const {name, href} = req.body;
    const socialLinkCountResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ?", [req.session.userID]);
    // checking user's social links count limit
    if(socialLinkCountResult[0].count <= MAX_LINKS_PER_USER) {
        await sqlQuery(res, "INSERT INTO social_links() VALUES(?, ?, ?, ?)", [nanoID.nanoid(), name, href, req.session.userID]);
        res.status(201).json({message:"Inserted successfully"});
    } else {
        res.status(400).json({error:"Too many social links for this user"});
    }
});

router.post("/update_link", checkBody(["ID", "name", "href"]), async (req, res) => {
    const {ID, name, href} = req.body;
    const linkOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ? AND ID = ?", [req.session.userID, ID]);
    if(linkOwnershipResult[0].count >= 1) {
        await sqlQuery(res, "UPDATE social_links SET name = ?, href = ? WHERE ID = ?", [name, href, ID]);
        res.status(200).json({message:"Update succeed"});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

router.delete("/delete_link", checkBody(["ID"]), async (req, res) => {
    const {ID} = req.body;
    const linkOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM social_links WHERE ID_user = ? AND ID = ?", [req.session.userID, ID]);
    if(linkOwnershipResult[0].count >= 1) {
        await sqlQuery(res, "DELETE FROM social_links WHERE ID = ?", [ID]);
        res.status(200).json({message:"Delete succeed"});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});




module.exports = router;