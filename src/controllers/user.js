"use strict";
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
// User Controllers:

const User = require("../models/user");
const Token = require("../models/token");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ------------------------------------------------------- */

// data = req.body
const validateUserData = function (data) {
  // Email Control:
  const isEmailValidated = data.email
    ? /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)
    : true;

  if (isEmailValidated) {
    const isPasswordValidated = data.password
      ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
          data.password
        )
      : true;

    if (isPasswordValidated) {
      return data;
    } else {
      throw new Error("Password is not validated.");
    }
  } else {
    throw new Error("Email is not validated.");
  }
};

/* ------------------------------------------------------- */

module.exports = {
  list: async (req, res) => {
    /*
            #swagger.tags = ["Users"]
            #swagger.summary = "List Users"
            #swagger.description = `
                You can use <u>filter[] & search[] & sort[] & page & limit</u> queries with endpoint.
                <ul> Examples:
                    <li>URL/?<b>filter[field1]=value1&filter[field2]=value2</b></li>
                    <li>URL/?<b>search[field1]=value1&search[field2]=value2</b></li>
                    <li>URL/?<b>sort[field1]=asc&sort[field2]=desc</b></li>
                    <li>URL/?<b>limit=10&page=1</b></li>
                </ul>
            `
        */

    const data = await res.getModelList(User);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(User),
      data,
    });
  },

  create: async (req, res) => {
    try {
      const validatedData = validateUserData(req.body);

      delete req.body.createdAt;
      delete req.body.updatedAt;
      delete req.body.isAdmin;
      delete req.body.isStaff;
      
      // console.log(req.file);
      if (req.file) {
        validatedData.image = req.file.path; // Cloudinary URL'ini image alanına ekle
    }

      //Create User
      const data = await User.create(validatedData);

      /* AUTO LOGIN */
      const salt = await bcrypt.genSalt(10);
      const tokenData = await Token.create({
        userId: data._id,
        token: await bcrypt.hash(data._id + Date.now(), salt),
      });

      const accessToken = jwt.sign(data.toJSON(), process.env.ACCESS_KEY, {
        expiresIn: "30m",
      });
      const refreshToken = jwt.sign(
        { _id: data._id, password: validatedData.password },
        process.env.REFRESH_KEY,
        { expiresIn: "3d" }
      );

      res.status(201).send({
        error: false,
        token: tokenData.token,
        bearer: { accessToken, refreshToken },
        data,
      });
    } catch (error) {
      res.status(400).send({
        error: true,
        message: error.message,
      });
    }
  },

  read: async (req, res) => {
    /*
            #swagger.tags = ["Users"]
            #swagger.summary = "Get Single User"
        */

    // Admin olmayan başkasınıın kaydına erişemez:
    // req.params.id = req.user.isAdmin ? req.params.id : req.user._id

    const data = await User.findOne({ _id: req.params.id });

    res.status(200).send({
      error: false,
      data,
    });
  },

  update: async (req, res) => {
    /*
            #swagger.tags = ["Users"]
            #swagger.summary = "Update User"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    "username": "test",
                    "password": "currentPassword", // Eski şifre
                    "newPassword": "newPassword", // Yeni şifre
                    "email": "test@site.com",
                    "firstName": "test",
                    "lastName": "test",
                }
            }
        */

    try {
      // Admin olmayan başkasının kaydına erişemez:
      req.params.id = req.user.isAdmin ? req.params.id : req.user._id;

      // Kullanıcıyı bul
      const user = await User.findOne({ _id: req.params.id });

      // Eski şifreyi doğrula
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .send({ error: true, message: "Password is incorrect." });
      }

      // Yeni şifre kontrolü ve hashleme
      if (req.body.newPassword) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.newPassword, salt);
      } else {
        // Yeni şifre yoksa mevcut şifreyi kullan
        req.body.password = user.password;
      }

      if (req.file) {
        req.body.image = req.file.path; 
    }

      if (req.user.isAdmin) {
        delete req.body.createdAt;
        delete req.body.updatedAt;
      } else {
        delete req.body.isAdmin;
        delete req.body.isStaff;
        delete req.body.createdAt;
        delete req.body.updatedAt;
      }
      // Kullanıcıyı güncelle
      const validatedData = validateUserData(req.body);
      const data = await User.updateOne({ _id: req.params.id }, validatedData, {
        runValidators: true,
      });

      res.status(202).send({
        error: false,
        data,
        new: await User.findOne({ _id: req.params.id }),
      });
    } catch (error) {
      res.status(400).send({
        error: true,
        message: error.message,
      });
    }
  },

  delete: async (req, res) => {
    /*
            #swagger.tags = ["Users"]
            #swagger.summary = "Delete User"
        */

    const data = await User.deleteOne({ _id: req.params.id });

    res.status(data.deletedCount ? 204 : 404).send({
      error: !data.deletedCount,
      data,
    });
  },
};
