/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */

const express = require("express");
const app = express();

/* ------------------------------------------------------- */
const cors = require("cors");

const whitelist = [
  "https://stock-app-beryl-theta.vercel.app",
  "http://localhost:3000",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));
/* ------------------------------------------------------- */

require("express-async-errors");
/* ------------------------------------------------------- */
require("dotenv").config();
const HOST = process.env?.HOST || "127.0.0.1";
const PORT = process.env?.PORT || 8000;

/* ------------------------------------------------------- */
const { dbConnection } = require("./src/configs/dbConnection");
dbConnection();
/* ------------------------------------------------------- */
app.use(express.json());

app.use("/upload", express.static("./upload"));

app.use(require("./src/middlewares/authentication"));

app.use(require("./src/middlewares/findSearchSortPage"));

/* ------------------------------------------------------- */

// ROUTES

app.all("/", (req, res) => {
  res.send({
    error: false,
    message: "Welcome to RENT A CAR API",
    documents: {
      swagger: "/document/swagger",
      redoc: "/document/redoc",
      json: "/document/json",
    },
    user: req.user,
  });
});

app.use(require("./src/routes"));

app.use("*", (req, res) => {
  res.errorStatusCode = 400;
  throw new Error("route not found!");
});

const loggerMiddleware = require("./src/middlewares/logger");

app.use(loggerMiddleware);

app.use(require("./src/middlewares/errorHandler"));

/* ------------------------------------------------------- */
app.listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
