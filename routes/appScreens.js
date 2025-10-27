

const express = require("express");
const path = require("path");
const { DateTime } = require("luxon");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { appScreensUpload } = require("../utils/multerUploads");
const { body, validationResult } = require("express-validator");

const router = express.Router();



// request specific app screenshot using ID
router.get("/app_screen", checkQuery(["ID"]), async (req, res) => {
    const {ID} = req.query;
    const IDuserResult = await sqlQuery(res, "SELECT a.ID_user, a.ID as ID_app FROM applications a INNER JOIN app_screens as ON a.ID=as.ID_application WHERE as.ID = ?", [ID]);
    const filePath = path.join(process.cwd(), "files", `${IDuserResult[0].ID_user}`, "apps", `${IDuserResult[0].ID_app}`, "screens");
    const directory = fs.readdirSync(filePath);
    const image = directory.find((obj) => obj.startsWith(ID));
    res.status(200).sendFile(path.join(filePath, image));
});

router.use(authorization());

// uploading app screenshots and adding descriptions to specific application using ID_application
router.post("/upload_app_screens", [appScreensUpload.array("files"), checkBody(["descriptions", "IDApplication"]),
    body("descriptions").isArray().withMessage("Must be an array"),
    body("descriptions.*").trim().isLength({min:1, max:25}).withMessage("Must be in length between 1 and 25")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {descriptions, IDApplication} = req.body;
    const appOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID_user = ?", [req.session.userID]);
    if(appOwnershipResult[0].count >= 1) {
        if(req.files) {
            const files = req.files.map((obj) => obj.fileName);
            if(files.length != descriptions.length) {
                return res.status(400).json({error:"Lengths aren't the same values"});
            }
            for(let i = 0;i<files.length;i++) {
                await sqlQuery(res, "INSERT INTO app_screens() VALUES(?, ?, ?)", [files[i], descriptions[i].trim(), IDApplication]);
                await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.utc().toSQL()]);
            }
            res.status(201).json({message:"Uploaded successfully"});
        } else {
            res.status(400).json({error:"Uploading failed"});
        }
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

// update app screenshot description
router.put("/update_app_screen", [checkBody(["IDAppScreen", "description"]),
    body("description").trim().isLength({min:1, max:25}).withMessage("Must be in length between 1 and 25")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDAppScreen, description} = req.body;
    const appScreenOwnershipResult = await sqlQuery(res, "SELECT COUNT(as.ID) as count FROM app_screens as INNER JOIN applications a ON a.ID=as.ID_application WHERE a.ID_user = ?", [req.session.userID]);
    if(appScreenOwnershipResult[0].count >= 1) {
        const updateResult = await sqlQuery(res, "UPDATE app_screens SET description = ? WHERE ID = ?", [description.trim(), IDAppScreen]);
        await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.utc().toSQL(), ID_application])
        res.status(200).json({message:"Updated Successfully", updated:updateResult.affectedRows})
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// delete screenshot using ID_screen
router.delete("/delete", checkBody(["IDScreen"]), async (req, res) => {
    const {IDScreen} = req.body;
    const appScreenOwnershipResult = await sqlQuery(res, "SELECT COUNT(as.ID) as count FROM app_screens as INNER JOIN applications a ON a.ID=as.ID_application WHERE a.ID_user = ?", [req.session.userID]);
    if(appScreenOwnershipResult[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM app_screens WHERE ID = ?", [IDScreen]);
        res.status(200).json({message:"Deleted successfully", deleted:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

module.exports = router;