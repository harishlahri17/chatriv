const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");


require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileToClodinary = (file) => {
    const isMedia = file.mimetype.startsWith('video') || file.mimetype.startsWith('audio');
    const options = {
        resource_type: isMedia ? 'video' : 'image',
    }
    return new Promise((resolve, reject) => {
        const uploader = isMedia ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
        uploader(file.path, options, (error, result) => {
            fs.unlink(file.path, () => { })
            if (error) {
                return reject(error);
            }
            resolve(result);
        })
    })
}


const multerMiddleware = multer({ dest: 'uploads/' }).single('media');

module.exports = { uploadFileToClodinary, multerMiddleware };