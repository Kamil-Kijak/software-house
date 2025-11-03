

const express = require("express");
const path = require("path");
const fs = require("fs");

const authorization = require("../utils/authorization");
const sendNotification = require("../utils/sendNotification");
const {appImageUpload, appFileUpload} = require("../utils/multerUploads");
const { DateTime } = require("luxon");
const { validationResult, body, query } = require("express-validator");

const Application = require("../models/Application");
const AppTag = require("../models/AppTag");
const AppScreen = require("../models/AppScreen");
const Opinion = require("../models/Opinion");
const { Sequelize, Op } = require("sequelize");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

const router = express.Router();

/*
    Applications endpoints for app API
    endpoints related to mysql applications table
*/

// requesting app image using app ID
router.get("/app_image", [
    query("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication} = req.query;
    const application = await Application.findByPk(idApplication, {attributes:["idUser"]});
    if(application) {
        const filePath = path.join(process.cwd(), "files", `${application.idUser}`, "apps", `${idApplication}`);
        const directory = fs.readdirSync(filePath);
        const image = directory.find((obj) => obj.startsWith("app."));
        if(image == undefined) {
            res.status(200).sendFile(path.join(process.cwd(), "assets", "defaultAppImage.png"));
        } else {
            res.status(200).sendFile(path.join(filePath, image));
        }
    } else {
        res.status(404).json({error:"Application not found"});
    }
});

// requesting app download file using app ID
router.get("/app_file", [
    query("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication} = req.query;
    const application = await Application.findByPk(idApplication, {attributes:["idUser", "appFile"]});
    if(application) {
        const filePath = path.join(process.cwd(), "files", `${application.idUser}`, "apps", `${idApplication}`);
        const directory = fs.readdirSync(filePath);
        const file = directory.find((obj) => obj.startsWith(application.appFile));
        if(file == undefined) {
            res.status(404).json({error:"File not found"})
        } else {
            res.status(200).sendFile(path.join(filePath, file));
        }
    } else {
        res.status(404).json({error:"Application not found"});
    }
});

// requesting application detailed data, also tags and screenshot IDs
router.get("/app_data", [
    query("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication} = req.query;
    const application = await Application.findByPk(idApplication, {
        attributes:["name", "description", "status", "public", "downloads", "appFile"],
        include:{
            model:AppTag,
            as:"appTags",
            attributes:["name"]
        }
    });
    const appScreens = await AppScreen.findAll({
        attributes:["id", "description"],
        where:{
            idApplication
        }
    });
    const opinionsAvg = await Opinion.findAll({
        attributes:[[Sequelize.fn("AVG", Sequelize.col("rating")), "avg"]],
        where:{
            idApplication
        }
    })
    res.status(200).json({message:"Retriviered app data", data:{
        application,
        appScreens,
        rating:opinionsAvg || 0
    }});
});

// requesting user applications filtered by name_filter
router.get("/user_applications", [
    query("idUser").exists({checkFalsy:true}).withMessage("idUser is required"),
    query("nameFilter").exists().withMessage("nameFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idUser, nameFilter, limit} = req.query;
    const applications = await Application.findAll({
        attributes: ["id", "name", "updateDate", "status", "public", "downloads", "description"],
        include:{
            model:AppTag,
            as:"appTags",
            attributes:["name"]
        },
        where: {
            idUser,
            name: {
                [Op.like]: `%${nameFilter}%`
            }
        },
        order: [["downloads", "DESC"]],
        ...(limit ? { limit } : { limit: 200 })
    });
    const ratings = await Opinion.findAll({
        attributes:["idApplication", [Sequelize.fn("AVG", Sequelize.col("rating")), "rating"]],
        group:["idApplication"],
        where:{
            idApplication:{
                [Op.in]:applications.map((obj) => obj.id)
            }
        }
    });
    const ratingMap = new Map(
        ratings.map((obj) => [obj.idApplication, obj.rating])
    );
    applications.forEach((app) => app.rating = ratingMap.get(app.id) ?? 0)
    res.status(200).json({message:"Retriviered applications", applications});
});


// requesting all applications using specific filters
router.get("/applications", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("nameFilter").exists().withMessage("nameFilter is required"),
    query("statusFilter").exists().withMessage("statusFilter is required").isWhitelisted(["release", "early-access", "beta-tests"]).withMessage("statusFilter can be release, early-access, beta-tests"),
    query("tagsFilter").exists({checkFalsy:true}).withMessage("tagsFilter is required").isArray().withMessage("tagsFilter type: array"),
    query("downloadsFilter").exists().withMessage("downloadsFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {usernameFilter, nameFilter, statusFilter, tagsFilter, downloadsFilter, limit} = req.query;
    const applications = await Application.findAll({
        attributes: ["id", "name", "updateDate", "status", "public", "downloads", "description", "idUser"],
        include:{
            model:AppTag,
            as:"appTags",
            attributes:["name"],
            ...(tagsFilter.length > 0 && {
                where:{
                    name:{
                        [Op.in]:tagsFilter
                    }
                }
            })
        },
        where: {
            name: {
                [Op.like]: `%${nameFilter}%`
            },
            ...(statusFilter && {status:statusFilter}),

        },
        order: [["downloads", downloadsFilter ? "ASC" : "DESC"]],
        ...(limit ? { limit } : { limit: 200 })
    });
    const ratings = await Opinion.findAll({
        attributes:["idApplication", [Sequelize.fn("AVG", Sequelize.col("rating")), "rating"]],
        group:["idApplication"],
        where:{
            idApplication:{
                [Op.in]:applications.map((obj) => obj.id)
            }
        }
    });
    const ratingMap = new Map(
        ratings.map((obj) => [obj.idApplication, obj.rating])
    );
    applications.forEach((app) => app.rating = ratingMap.get(app.id) ?? 0)
    const users = await User.findAll({
        attributes:["id", "username"],
        where:{
            username:{
                [Op.like]:`%${usernameFilter}%`
            }
        }
    });
    const filteredApplications = applications.filter((app) => users.map(user => user.id).includes(app.idUser));
    const usersMap = new Map(
        users.map(obj => [obj.id, {user: obj.id, user: obj.username}])
    )
    filteredApplications.forEach((app) => app.user = usersMap.get(app.idUser) ?? null)

    res.status(200).json({message:"Retriviered applications", applications:filteredApplications});
});

router.use(authorization());

// requesting subscribed users applications by session user, filtered by specific filters
router.get("/subscribed_applications", [
    query("usernameFilter").exists().withMessage("usernameFilter is required"),
    query("nameFilter").exists().withMessage("nameFilter is required"),
    query("statusFilter").exists().withMessage("statusFilter is required").isWhitelisted(["release", "early-access", "beta-tests"]).withMessage("statusFilter can be release, early-access, beta-tests"),
    query("tagsFilter").exists({checkFalsy:true}).withMessage("tagsFilter is required").isArray().withMessage("tagsFilter type: array"),
    query("downloadsFilter").exists().withMessage("downloadsFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {usernameFilter, nameFilter, statusFilter, tagsFilter, downloadsFilter, limit} = req.body;
    const users = await User.findAll({
        attributes:["id", "username"],
        include:{
            model:Subscription,
            as:"subscribed",
            attributes:[],
            where:{
                idUser:req.session.userID
            }
        },
        where:{
            username:{
                [Op.like]:`%${usernameFilter}%`
            }
        }
    });

    const applications = await Application.findAll({
        attributes: ["id", "name", "updateDate", "status", "public", "downloads", "description", "idUser"],
        include:{
            model:AppTag,
            as:"appTags",
            attributes:["name"],
            ...(tagsFilter.length > 0 && {
                where:{
                    name:{
                        [Op.in]:tagsFilter
                    }
                }
            })
        },
        where: {
            idUser:{
                [Op.in]:users.map((user) => user.id)
            },
            name: {
                [Op.like]: `%${nameFilter}%`
            },
            ...(statusFilter && {status:statusFilter}),

        },
        order: [["downloads", downloadsFilter ? "ASC" : "DESC"]],
        ...(limit ? { limit } : { limit: 200 })
    });
    const ratings = await Opinion.findAll({
        attributes:["idApplication", [Sequelize.fn("AVG", Sequelize.col("rating")), "rating"]],
        group:["idApplication"],
        where:{
            idApplication:{
                [Op.in]:applications.map((obj) => obj.id)
            }
        }
    });
    const ratingMap = new Map(
        ratings.map((obj) => [obj.idApplication, obj.rating])
    );
    applications.forEach((app) => app.rating = ratingMap.get(app.id) ?? 0)

    res.status(200).json({message:"Retriviered applications", applications});
});

// requesting session user applications by specific filters
router.get("/my_applications", [
    query("nameFilter").exists().withMessage("nameFilter is required"),
    query("statusFilter").exists().withMessage("statusFilter is required").isWhitelisted(["release", "early-access", "beta-tests"]).withMessage("statusFilter can be release, early-access, beta-tests"),
    query("tagsFilter").exists({checkFalsy:true}).withMessage("tagsFilter is required").isArray().withMessage("tagsFilter type: array"),
    query("downloadsFilter").exists().withMessage("downloadsFilter is required"),
    query("limit").exists().withMessage("limit is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {nameFilter, statusFilter, tagsFilter, downloadsFilter, limit} = req.query;
    const applications = await Application.findAll({
        attributes: ["id", "name", "updateDate", "status", "public", "downloads", "description", "idUser"],
        include:{
            model:AppTag,
            as:"appTags",
            attributes:["name"],
            ...(tagsFilter.length > 0 && {
                where:{
                    name:{
                        [Op.in]:tagsFilter
                    }
                }
            })
        },
        where: {
            name: {
                [Op.like]: `%${nameFilter}%`
            },
            idUser:req.session.userID,
            ...(statusFilter && {status:statusFilter}),

        },
        order: [["downloads", downloadsFilter ? "ASC" : "DESC"]],
        ...(limit ? { limit } : { limit: 200 })
    });
    const ratings = await Opinion.findAll({
        attributes:["idApplication", [Sequelize.fn("AVG", Sequelize.col("rating")), "rating"]],
        group:["idApplication"],
        where:{
            idApplication:{
                [Op.in]:applications.map((obj) => obj.id)
            }
        }
    });
    const ratingMap = new Map(
        ratings.map((obj) => [obj.idApplication, obj.rating])
    );
    applications.forEach((app) => app.rating = ratingMap.get(app.id) ?? 0)

    res.status(200).json({message:"Retriviered applications", applications});
});

// uploading application image using ID_application
router.post("/upload_app_image", [appImageUpload.single("file"),
    body("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication} = req.body;
    if(req.file) {
        await Application.update({updateDate:DateTime.utc().toJSDate()}, {where:{id:idApplication}})
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});

// uploading application download file using ID_application
router.post("/upload_app_file", [appFileUpload.single("file"),
    body("idApplication").exists({checkFalsy:true}).withMessage("idApplication is required")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {idApplication} = req.body;
    if(req.file) {
        await Application.update({appFile:req.file.filename, updateDate:DateTime.utc().toJSDate()}, {where:{id:idApplication}})
        if(Number(process.env.CONSOLE_LOGS)) {
            console.log(`Uploaded app file, ID app ${idApplication}`);
        }
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});

// request insert application empty sketch
router.post("/upload_application", [checkBody(["name", "description", "status"]),
    body("name").trim().exists({checkFalsy:true}).withMessage("name is required").isLength({min:1, max:25}).withMessage("name length between 1 and 25"),
    body("description").exists().withMessage("description is required").isLength({max:65535}).withMessage("description max length: 65535"),
    body("status").exists({checkFalsy:true}).withMessage("status is required").isWhitelisted(["release","early-access","beta-tests"]).withMessage("status can be release, early-access, beta-tests")
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, description, status} = req.body;
    const trimmedName = name.trim();
    const app = await Application.create({
        name:trimmedName,
        description,
        updateDate:DateTime.utc().toJSDate(),
        status,
        idUser:req.session.userID
    });
    if(Number(process.env.CONSOLE_LOGS)) {
        console.log(`Upload app file, ID app ${app.id}`);
    }
    res.status(201).json({message:"Inserted successfully"});
});

// change visibility to public/private
router.put("/change_public", checkBody(["IDApplication", "public"]), async (req, res) => {
    const {IDApplication, public} = req.body;
    const applicationOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID = ? AND ID_user = ?", [IDApplication, req.session.userID]);
    if(applicationOwnershipResult[0].count >= 1) {
        await sqlQuery(res, "UPDATE applications SET public = ? WHERE ID = ?", [public ? "1" : "0", IDApplication]);
        // sending notification about uploaded application
        if(Number(public) == 1) {
            const usersResult = await sqlQuery(res, "SELECT ID_user FROM subscriptions WHERE notifications != 'none' AND ID_subscribed = ?", [req.session.userID]);
            const usernameResult = await sqlQuery(res, "SELECT username FROM users WHERE ID = ?", [req.session.userID]);
            for(const userID in usersResult) {
                sendNotification(res, `New publish by ${usernameResult[0].username}`, null, userID.ID_user);
            }
            if(Number(process.env.CONSOLE_LOGS)) {
                console.log(`New publish ID app ${IDApplication}`);
            }
        }
        res.status(200).json({message:"Changed successfully"});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

// update application by ID
router.put("/update_application", [checkBody(["IDApplication", "name", "description", "status"]),
    body("name").trim().isLength({min:1, max:25}).withMessage("Must be in length between 1 and 25"),
    body("description").isLength({max:65535}).withMessage("Is too long"),
    body("status").isWhitelisted(["release","early-access","beta-tests"]).withMessage("Is not match release, early-access or beta-tests")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {IDApplication, name, description, status} = req.body;
    const applicationOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID = ? AND ID_user = ?", [IDApplication, req.session.userID]);
    if(applicationOwnershipResult[0].count >= 1) {
        const updateResult = await sqlQuery(res, "UPDATE applications SET name = ?, description = ?, status = ?, update_date = ? WHERE ID = ?", [name, description, status, DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss"), IDApplication]);
        res.status(200).json({message:"Updated successfully", updated:updateResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

router.delete("/delete_application", checkBody(["IDApplication"]), async (req, res) => {
    const {IDApplication} = req.body;
    const applicationOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID = ? AND ID_user = ?", [IDApplication, req.session.userID]);
    if(applicationOwnershipResult[0].count >= 1) {
        const deleteResult = await sqlQuery(res, "DELETE FROM applications WHERE ID = ?", [IDApplication]);
        res.status(200).json({message:"Delete successfully", updated:deleteResult.affectedRows});
    } else {
        res.status(403).json({error:"You don't have permission for delete this resource"});
    }
});

module.exports = router;