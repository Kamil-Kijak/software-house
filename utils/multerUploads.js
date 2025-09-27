
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// MIME Filter
const fileFilter = function (req, file, cb) {
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
            fs.mkdirSync(folderPath, { recursive: true }, (err) => {
                console.log("Error with creating new folder: ", err);
            });
        }
        cb(null, folderPath);
    },
    filename:(req, file, cb) => {
        cb(null, `profile.${path.extname(file.originalname)}`);
    }
});

const profileImageUpload = multer({
    storage:profileImageStorage,
    fileFilter:fileFilter,
    // max 8 MB
    limits: { fileSize: 8 * 1024 * 1024 }
})

module.exports = {
    profileImageUpload
}
