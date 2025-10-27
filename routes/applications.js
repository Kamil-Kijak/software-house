

const express = require("express");
const nanoID = require("nanoid");
const path = require("path");
const fs = require("fs");

const checkBody = require("../utils/checkBody");
const sqlQuery = require("../utils/mysqlQuery");
const authorization = require("../utils/authorization");
const sendNotification = require("../utils/sendNotification");
const {appImageUpload, appFileUpload} = require("../utils/multerUploads");
const { DateTime } = require("luxon");
const checkQuery = require("../utils/checkQuery");
const { validationResult, body } = require("express-validator");

const router = express.Router();

/*
    Applications endpoints for app API
    endpoints related to mysql applications table
*/

// requesting app image using app ID
router.get("/app_image", checkQuery(["IDApplication"]), async (req, res) => {
    const {IDApplication} = req.query;
    const IDuserResult = await sqlQuery(res, "SELECT ID_user FROM applications WHERE ID = ?", [IDApplication]);
    const filePath = path.join(process.cwd(), "files", `${IDuserResult[0].ID_user}`, "apps", `${IDApplication}`);
    const directory = fs.readdirSync(filePath);
    const image = directory.find((obj) => obj.startsWith("app."));
    if(image == undefined) {
        res.status(200).sendFile(path.join(process.cwd(), "assets", "defaultAppImage.png"));
    } else {
        res.status(200).sendFile(path.join(filePath, image));
    }
});

// requesting app download file using app ID
router.get("/app_file", checkQuery(["IDApplication"]), async (req, res) => {
    const {IDApplication} = req.query;
    const appDataResult = await sqlQuery(res, "SELECT ID_user, app_file FROM applications WHERE ID = ?", [IDApplication]);
    const filePath = path.join(process.cwd(), "files", `${appDataResult[0].ID_user}`, "apps", `${IDApplication}`);
    const directory = fs.readdirSync(filePath);
    const file = directory.find((obj) => obj.startsWith(appDataResult[0].app_file));
    if(file == undefined) {
        res.status(404).json({error:"File not found"})
    } else {
        res.status(200).sendFile(path.join(filePath, file));
    }
});

// requesting application detailed data, also tags and screenshot IDs
router.get("/app_data", checkQuery(["IDApplication"]), async (req, res) => {
    const {IDApplication} = req.query;
    const infoResult = await sqlQuery(res, "SELECT name, description, status, public, downloads, app_file FROM applications WHERE ID = ?", [IDApplication]);
    const tagsResult = await sqlQuery(res, "SELECT name FROM app_tags WHERE ID_application = ?", [IDApplication]);
    const tagsArray = tagsResult.map((obj) => obj.name);
    const screensResult = await sqlQuery(res, "SELECT ID, description FROM app_screens WHERE ID_application = ?", [IDApplication]);
    const opinionsAvgResult = await sqlQuery(res, "SELECT AVG(rating) as avg FROM opinions WHERE ID_application = ?", [IDApplication]);
    res.status(200).json({message:"Retriviered app data", application:{
        ...infoResult[0],
        tags:tagsArray,
        screens:screensResult,
        rating:opinionsAvgResult[0].avg || 0
    }});
});

// requesting user applications filtered by name_filter
router.get("/user_applications", checkQuery(["IDuser", "nameFilter", "limit"]), async (req, res) => {
    const {IDUser, nameFilter, limit} = req.query;
    const applicationsResult = await sqlQuery(res, "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag FROM applications a INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.ID_user = ? AND a.name LIKE ? ORDER BY a.downloads DESC", [IDUser, `%${nameFilter}%`, limit || "200"]);
    const appRatingAvgResult = await sqlQuery(res, "SELECT AVG(o.rating) as rating, a.ID FROM opinions o INNER JOIN applications a ON a.ID=o.ID_application WHERE a.ID_user = ? AND a.name LIKE ? GROUP BY a.ID ORDER BY a.downloads DESC LIMIT ?", [IDUser, `%${nameFilter}%`, limit || "200"]);
    const ratingAverages = {};
    appRatingAvgResult.forEach((obj) => ratingAverages[obj.ID] = obj.rating);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                updateDate:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                description:obj.description,
                rating:ratingAverages[obj.ID] || 0,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});


// requesting all applications using specific filters
router.get("/applications", checkQuery(["usernameFilter", "nameFilter", "statusFilter", "tagsFilter", "downloadsFilter", "limit"]), async (req, res) => {
    const {usernameFilter, nameFilter, statusFilter, tagsFilter, downloadsFilter, limit} = req.body;
    let sqlString = "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag, u.ID as userID, u.username FROM applications a INNER JOIN users u ON u.ID=a.ID_user INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.public = 1";
    let ratingsSqlString = "SELECT AVG(o.rating) as rating, a.ID FROM opinions o INNER JOIN applications a ON a.ID=o.ID_application INNER JOIN users u u.ID=a.ID_user WHERE a.public = 1 AND a.name LIKE ?";
    const params = [];
    const ratingsParams = [`%${nameFilter}%`];
    if(tagsFilter) {
        if(tagsFilter.length > 0) {
            sqlString+= ` AND at.name IN (${tagsFilter.map(obj => "?").join(", ")})`;
            params.push(...tagsFilter);
        }
    }
    if(statusFilter) {
        sqlString+=" AND a.status = ?";
        ratingsSqlString += " AND a.status = ?";
        params.push(statusFilter);
        ratingsParams.push(statusFilter);
    }
    sqlString+=" AND a.name LIKE ? AND u.username LIKE ?";
    params.push(`%${nameFilter}%`, `%${usernameFilter}%`);

    ratingsSqlString+= " AND u.username LIKE ?";
    params.push(`%${usernameFilter}%`);

    ratingsSqlString += " GROUP BY a.ID";
    if(downloadsFilter) {
        sqlString+=" ORDER BY a.downloads";
        ratingsSqlString +=" ORDER BY a.downloads";
    } else {
        sqlString+=" ORDER BY a.downloads DESC";
        ratingsSqlString +=" ORDER BY a.downloads DESC";
    }
    sqlString += " LIMIT ?";
    params.push(limit || "200");
    ratingsSqlString += " LIMIT ?";
    ratingsParams.push(limit || "200");
    const applicationsResult = await sqlQuery(res, sqlString, params);
    const appRatingAvgResult = await sqlQuery(res, ratingsSqlString, ratingsParams);

    const ratingAverages = {};
    appRatingAvgResult.forEach((obj) => ratingAverages[obj.ID] = obj.rating);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                updateDate:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                description:obj.description,
                userID:obj.userID,
                username:obj.username,
                rating:ratingAverages[obj.ID] || 0,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});

router.use(authorization());

// requesting subscribed users applications by session user, filtered by specific filters
router.get("/subscribed_applications", checkQuery(["usernameFilter", "nameFilter", "statusFilter", "tagsFilter", "downloadsFilter", "limit"]), async (req, res) => {
    const {usernameFilter, nameFilter, statusFilter, tagsFilter, downloadsFilter, limit} = req.body;
    let sqlString = "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag, u.ID as userID, u.username FROM applications a INNER JOIN users u ON u.ID=a.ID_user INNER JOIN app_tags at ON at.ID_application=a.ID INNER JOIN subscriptions s ON s.ID_subscribed=a.ID_user WHERE s.ID_user = ? AND a.public = 1";
    let ratingsSqlString = "SELECT AVG(o.rating) as rating, a.ID FROM opinions o INNER JOIN applications a ON a.ID=o.ID_application INNER JOIN users u u.ID=a.ID_user INNER JOIN subscriptions s ON s.ID_subscribed=a.ID_user WHERE a.public = 1 AND s.ID_user = ?";
    
    const params = [req.session.userID];
    const ratingsParams = [req.session.userID];
    if(tagsFilter) {
        if(tagsFilter.length > 0) {
            sqlString+= ` AND at.name IN (${tagsFilter.map(obj => "?").join(", ")})`;
            params.push(...tagsFilter);
        }
    }
    if(statusFilter) {
        sqlString+=" AND a.status = ?";
        params.push(statusFilter);
        ratingsSqlString+= " AND a.status = ?";
        ratingsParams.push(statusFilter);
    }
    sqlString+=" AND a.name LIKE ? AND u.username LIKE ?";
    params.push(`%${nameFilter}%`, `%${usernameFilter}%`);

    ratingsSqlString+= " AND a.name LIKE ? AND u.username LIKE ?";
    ratingsParams.push(`%${nameFilter}%`, `%${usernameFilter}%`);
    ratingsSqlString += " GROUP BY a.ID";
    if(downloadsFilter) {
        sqlString+=" ORDER BY a.downloads";
        ratingsSqlString +=" ORDER BY a.downloads";
    } else {
        sqlString+=" ORDER BY a.downloads DESC";
        ratingsSqlString +=" ORDER BY a.downloads DESC";
    }

    sqlString += " LIMIT ?";
    params.push(limit || "200");
    ratingsSqlString += " LIMIT ?";
    ratingsParams.push(limit || "200");
    const applicationsResult = await sqlQuery(res, sqlString, params);
    const appRatingAvgResult = await sqlQuery(res, ratingsSqlString, ratingsParams);

    const ratingAverages = {};
    appRatingAvgResult.forEach((obj) => ratingAverages[obj.ID] = obj.rating);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                updateDate:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                description:obj.description,
                userID:obj.userID,
                username:obj.username,
                rating:ratingAverages[obj.ID] || 0,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});

// requesting session user applications by specific filters
router.get("/my_applications", checkQuery(["usernameFilter", "nameFilter", "statusFilter", "tagsFilter", "downloadsFilter", "limit"]), async (req, res) => {
    // retrive user applications using filters
    const {nameFilter, statusFilter, publicFilter, tagsFilter, downloadsFilter} = req.query;
    let sqlString = "SELECT a.ID, a.name, a.update_date, a.status, a.public, a.downloads, a.description, at.name as tag FROM applications a INNER JOIN app_tags at ON at.ID_application=a.ID WHERE a.ID_user = ?";
    let ratingsSqlString = "SELECT AVG(o.rating) as rating, a.ID FROM opinions o INNER JOIN applications a ON a.ID=o.ID_application WHERE a.ID_user = ?";
    const params = [req.session.userID];
    const ratingsParams = [req.session.userID];
    if(tagsFilter) {
        if(tagsFilter.length > 0) {
            sqlString+= ` AND at.name IN (${tagsFilter.map(obj => "?").join(", ")})`;
            params.push(...tagsFilter);
        }
    }
    if(publicFilter) {
        sqlString+=" AND a.public = ?";
        params.push(publicFilter);
        ratingsSqlString+= " AND a.public = ?";
        ratingsParams.push(publicFilter);
    }
    if(statusFilter) {
        sqlString+=" AND a.status = ?";
        params.push(statusFilter);
        ratingsSqlString+= " AND a.status = ?";
        ratingsParams.push(statusFilter);
    }
    sqlString+=" AND a.name LIKE ?";
    params.push(`%${nameFilter}%`);

    ratingsSqlString+= " AND a.name LIKE ?";
    ratingsParams.push(`%${nameFilter}%`);

    ratingsSqlString += " GROUP BY a.ID";
    if(downloadsFilter) {
        sqlString+=" ORDER BY a.downloads";
        ratingsSqlString +=" ORDER BY a.downloads";
    } else {
        sqlString+=" ORDER BY a.downloads DESC";
        ratingsSqlString +=" ORDER BY a.downloads DESC";
    }

    sqlString += " LIMIT ?";
    params.push(limit || "200");
    ratingsSqlString += " LIMIT ?";
    ratingsParams.push(limit || "200");
    const applicationsResult = await sqlQuery(res, sqlString, params);
    const appRatingAvgResult = await sqlQuery(res, ratingsSqlString, ratingsParams);

    const ratingAverages = {};
    appRatingAvgResult.forEach((obj) => ratingAverages[obj.ID] = obj.rating);
    const finalResult = [];
    applicationsResult.forEach((obj) => {
        const object = finalResult.find((value) => value.ID === obj.ID)
        if(object == undefined) {
            finalResult.push({
                ID:obj.ID,
                name:obj.name,
                updateDate:obj.update_date,
                public:obj.public,
                downloads:obj.downloads,
                description:obj.description,
                rating:ratingAverages[obj.ID] || 0,
                tags:[obj.tag]
            });
        } else {
            object.tags.push(obj.tag);
        }
    });
    res.status(200).json({message:"Retriviered applications", applications:finalResult});
});

// uploading application image using ID_application
router.post("/upload_app_image", appImageUpload.single("file"), checkBody(["IDApplication"]), async (req, res) => {
    // require req.body.IDApplication
    const {IDApplication} = req.body;
    if(req.file) {
        await sqlQuery(res, "UPDATE applications SET update_date = ? WHERE ID = ?", [DateTime.utc().toSQL(), IDApplication]);
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});

// uploading application download file using ID_application
router.post("/upload_app_file", appFileUpload.single("file"), checkBody(["IDApplication"]), async (req, res) => {
    // require req.body.IDApplication
    const {IDApplication} = req.body;
    if(req.file) {
        await sqlQuery(res, "UPDATE applications SET app_file = ?, update_date = ? WHERE ID = ?", [req.file.filename, DateTime.utc().toSQL(), IDApplication]);
        if(Number(process.env.CONSOLE_LOGS)) {
            console.log(`Uploaded app file, ID app ${IDApplication}`);
        }
        res.status(200).json({message:"Uploading succeed"});
    } else {
        res.status(400).json({error:"Uploading failed"})
    }
});

// request insert application empty sketch
router.post("/upload_application", [checkBody(["name", "description", "status"]),
    body("name").trim().isLength({min:1, max:25}).withMessage("Must be in length between 1 and 25"),
    body("description").isLength({max:65535}).withMessage("Is too long"),
    body("status").isWhitelisted(["release","early-access","beta-tests"]).withMessage("Is not match release, early-access or beta-tests")
], async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, description, status} = req.body;
    const trimmedName = name.trim();
    const ID = nanoID.nanoid();
    await sqlQuery(res, "INSERT INTO applications() VALUES(?, ?, NULL, ?, ?, 0, 0, ?)", [ID, trimmedName, description, DateTime.utc().toSQL(), status, req.session.userID]);
    if(Number(process.env.CONSOLE_LOGS)) {
        console.log(`Upload app file, ID app ${ID}`);
    }
    res.status(201).json({message:"Inserted successfully"});
});

// change visibility to public/private
router.put("/change_public", checkBody(["IDApplication", "public"]), async (req, res) => {
    const {IDApplication, public} = req.body;
    const applicationOwnershipResult = await sqlQuery(res, "SELECT COUNT(ID) as count FROM applications WHERE ID = ? AND ID_user = ?", [IDApplication, req.session.userID]);
    if(applicationOwnershipResult[0].count >= 1) {
        await sqlQuery(res, "UPDATE applications SET public = ? WHERE ID = ?", [public ? "1" : "1", IDApplication]);
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
        const updateResult = await sqlQuery(res, "UPDATE applications SET name = ?, description = ?, status = ?, update_date = ? WHERE ID = ?", [name, description, status, DateTime.utc().toSQL(), IDApplication]);
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