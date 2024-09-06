"use strict";
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
// app.use(upload.array('fieldName'))

const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,       
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Yüklenen dosyaların kaydedileceği klasör
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    public_id: (req, file) => {
      const name = file.originalname.split('.').slice(0, -1).join('.');
      return Date.now() + '-' + name;
    }
  },
});

module.exports = multer({storage: storage, limits: { fileSize: 1024 * 1024 * 1 }});
