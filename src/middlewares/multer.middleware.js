import multer from "multer";

const storage = multer.diskStorage({
    /** set destination for file upload */
    destination: (req, file, cb) => {
        cb(null, "./public/temp")
    },
    /** set custom filename */
    filename: (req, file, cb) => {
        const customfilename = Date.now() + "-" + file.originalname
        cb(null, customfilename)
    }
})

export const upload = multer({
    storage,
})