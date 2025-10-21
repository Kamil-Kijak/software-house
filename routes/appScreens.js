

const express = require("express");
const path = require("path");
const { DateTime } = require("luxon");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const checkQuery = require("../utils/checkQuery");
const { appScreensUpload } = require("../utils/multerUploads");

const router = express.Router();

router.use(authorization());


// request specific app screenshot using ID
router.get("/app_screen", checkQuery(["ID"]), async (req, res) => {
    const {ID} = req.query;
    const IDuserResult = await sqlQuery(res, "SELECT a.ID_user, a.ID as ID_app FROM applications a INNER JOIN app_screens as ON a.ID=as.ID_application WHERE as.ID = ?", [ID]);
    const filePath = path.join(process.cwd(), "files", `${IDuserResult[0].ID_user}`, "apps", `${IDuserResult[0].ID_app}`, "screens");
    const directory = fs.readdirSync(filePath);
    const image = directory.find((obj) => obj.startsWith(ID));
    res.status(200).sendFile(path.join(filePath, image));
});

// uploading app screenshots and adding descriptions to specific application using ID_application
router.post("/upload_app_screens", appScreensUpload.array("files"), checkBody(["descriptions", "ID_application"]), async (req, res) => {
    const {descriptions, ID_application} = req.body;
    if(req.files) {
        const files = req.files.map((obj) => obj.fileName);
        if(files.length != descriptions.length) {
            return res.status(400).json({error:"Lengths aren't the same values"});
        }
        for(let i = 0;i<files.length;i++) {
            await sqlQuery(res, "INSERT INTO app_screens() VALUES(?, ?, ?)", [files[i], descriptions[i], ID_application]);
            await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.now().toISO()]);
        }
        res.status(201).json({message:"Uploaded successfully"});
    } else {
        res.status(400).json({error:"Uploading failed"});
    }
});

// update app screenshot description
router.put("/update_app_screen", checkBody(["ID_application", "ID_app_screen", "description"]), async (req, res) => {
    const {ID_application, ID_app_screen, description} = req.body;
    await sqlQuery(res, "UPDATE app_screens SET description = ? WHERE ID = ? AND ID_application = ?", [description, ID_app_screen, ID_application]);
    await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.now().toISO(), ID_application])
    res.status(200).json({message:"Updated Successfully"})
});

// delete screenshot using ID_screen
router.delete("/delete", checkBody(["ID_screen"]), async (req, res) => {
    const {ID_screen} = req.body;
    await sqlQuery(res, "DELETE FROM app_screens WHERE ID = ?", [ID_screen]);
    res.status(200).json({message:"Deleted successfully"});
});

module.exports = router;