
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nanoID = require("nanoid");


const IMAGE_MAX_MB_SIZE = 8;
const FILE_MAX_MB_SIZE = 500;


// MIME Filter
const imageFileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};


const profileImageStorage = multer.diskStorage({
    destination:(req, file, cb) => {
        const folderPath = path.join(process.cwd(), `files`, `${req.session.userID}`);
        if(!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                cb(null, folderPath);
            } catch (err) {
                console.log("Error with creating new folder: ", err);
                cb(err, null);
            }
        }
        cb(null, folderPath);
    },
    filename:(req, file, cb) => {
        cb(null, `profile.${path.extname(file.originalname)}`);
    }
});

const appImageStorage = multer.diskStorage({
    destination:(req, file, cb) => {
        // require req.body.IDApplication
        if(!req.body.IDApplication) {
            cb(new Error("ID_application is not defined"), folderPath);
        }
        const folderPath = path.join(process.cwd(), `files`, `${req.session.userID}`, "apps", `${req.body.ID_application}`);
        if(!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                cb(null, folderPath);
            } catch (err) {
                console.log("Error with creating new folder: ", err);
                cb(err, null);
            }
        }
        cb(null, folderPath);
    },
    filename:(req, file, cb) => {
        cb(null, `app.${path.extname(file.originalname)}`);
    }
});

const appFileStorage = multer.diskStorage({
    destination:(req, file, cb) => {
        // require req.body.IDApplication
        if(!req.body.IDApplication) {
            cb(new Error("ID_application is not defined"), folderPath);
        }
        const folderPath = path.join(process.cwd(), `files`, `${req.session.userID}`, "apps", `${req.body.ID_application}`, "download");
        if(!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                cb(null, folderPath);
            } catch (err) {
                console.log("Error with creating new folder: ", err);
                cb(err, null);
            }
        }
        cb(null, folderPath);
    },
    filename:(req, file, cb) => {
        cb(null, file.originalname);
    }
});

const appScreensStorage = multer.diskStorage({
    destination:(req, file, cb) => {
        // require req.body.IDApplication
        if(!req.body.IDApplication) {
            cb(new Error("ID_application is not defined"), folderPath);
        }
        const folderPath = path.join(process.cwd(), `files`, `${req.session.userID}`, "apps", `${req.body.ID_application}`, "screens");
        if(!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                cb(null, folderPath);
            } catch (err) {
                console.log("Error with creating new folder: ", err);
                cb(err, null);
            }
        }
        cb(null, folderPath);
    },
    filename:(req, file, cb) => {
        cb(null, `${nanoID.nanoid()}.${path.extname(file.originalname)}`);
    }
});

const appFileUpload = multer({
    storage:appFileStorage,
    limits: { fileSize: FILE_MAX_MB_SIZE * 1024 * 1024 }
});

const appImageUpload = multer({
    storage:appImageStorage,
    fileFilter:imageFileFilter,
    limits: { fileSize: IMAGE_MAX_MB_SIZE * 1024 * 1024 }
});

const profileImageUpload = multer({
    storage:profileImageStorage,
    fileFilter:imageFileFilter,
    // max 8 MB
    limits: { fileSize: IMAGE_MAX_MB_SIZE * 1024 * 1024 }
});

const appScreensUpload = multer({
    storage:appScreensStorage,
    fileFilter:imageFileFilter,
    // max 8 MB
    limits: { fileSize: IMAGE_MAX_MB_SIZE * 1024 * 1024 }
});

module.exports = {
    profileImageUpload,
    appImageUpload,
    appFileUpload,
    appScreensUpload
}
