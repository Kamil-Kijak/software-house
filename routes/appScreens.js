

const express = require("express");
const path = require("path");
const { DateTime } = require("luxon");

const authorization = require("../utils/authorization");
const { appScreensUpload } = require("../utils/multerUploads");
const { body, validationResult, query } = require("express-validator");

const AppScreen = require("../models/AppScreen");
const Application = require("../models/Application");

const router = express.Router();



// request specific app screenshot using ID
router.get("/app_screen", [
    query("id").exists({checkFalsy:true}).withMessage("id is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {id} = req.query;
    const appScreen = await Application.findOne({
        attributes:["idUser", ["id", "idApp"]],
        include:{
            model:AppScreen,
            as:"appScreens",
            where:{id}
        }
    });
    if(appScreen){
        const filePath = path.join(process.cwd(), "files", `${appScreen.idUser}`, "apps", `${appScreen.idApp}`, "screens");
        const directory = fs.readdirSync(filePath);
        const image = directory.find((obj) => obj.startsWith(id));
        res.status(200).sendFile(path.join(filePath, image));
    } else {
        res.status(404).json({error:"app screen not found"});
    }
});

router.use(authorization());

// uploading app screenshots and adding descriptions to specific application using ID_application
router.post("/upload_app_screens", [appScreensUpload.array("files"),
    body("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required"),
    body("descriptions").exists({checkFalsy:true}).withMessage("descriptions is required").isArray().withMessage("Must be an array"),
    body("descriptions.*").trim().isLength({min:1, max:25}).withMessage("description in description length between 1 and 25")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {descriptions, idApplication} = req.body;
    const appOwnership = await Application.count({where:{idUser:req.session.userID}})
    if(appOwnership >= 1) {
        if(req.files) {
            const files = req.files.map((obj) => obj.fileName);
            if(files.length != descriptions.length) {
                return res.status(400).json({error:"Lengths aren't the same values"});
            }
            for(let i = 0;i<files.length;i++) {
                await AppScreen.create({
                    id:files[i],
                    description:descriptions[i].trim(),
                    idApplication
                });
            }
            await Application.update({updateDate:DateTime.utc().toJSDate()}, {where:{id:idApplication}});
            res.status(201).json({message:"Uploaded successfully"});
        } else {
            res.status(400).json({error:"Uploading failed"});
        }
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

// update app screenshot description
router.put("/update_app_screen", [
    body("idAppScreen").exists({checkFalsy:true}).withMessage("idAppScreen is required"),
    body("description").trim().exists({checkFalsy:true}).withMessage("description is required").isLength({min:1, max:25}).withMessage("description length between 1 and 25")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idAppScreen, description} = req.body;
    const appScreenOwnership = await AppScreen.count({
        include:{
            model:Application,
            as:"application",
            where:{
                idUser:req.session.userID
            }
        }
    })
    if(appScreenOwnership >= 1) {
        const [affectedRows] = await AppScreen.update({description:description.trim()}, {where:{id:idAppScreen}});
        const appScreen = await AppScreen.findByPk(idAppScreen, {
            attributes:["idApplication"],
        });
        await Application.update({updateDate:DateTime.utc().toJSDate()}, {where:{id:appScreen.idApplication}});
        res.status(200).json({message:"Updated Successfully", affectedRows})
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

// delete screenshot using ID_screen
router.delete("/delete", [
    body("idAppScreen").exists({checkFalsy:true}).withMessage("idAppScreen is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idAppScreen} = req.body;
    const appScreenOwnership = await AppScreen.count({
        include:{
            model:Application,
            as:"application",
            where:{
                idUser:req.session.userID
            }
        }
    })
    if(appScreenOwnership >= 1) {
        const affectedRows = await AppScreen.destroy({where:{id:idAppScreen}});
        res.status(200).json({message:"Deleted successfully", affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for update this resource"});
    }
});

module.exports = router;