"use strict"
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
// $ npm install winston winston-loggly-bulk

const winston = require('winston');
const { Loggly } = require('winston-loggly-bulk');

// Loggly transportunu ekleme
winston.add(new Loggly({
    token: "a0f0c78f-6820-45d7-ac07-f7ea6c72709b",
    subdomain: "mustsel",
    tags: ["Winston-NodeJS"],
    json: true
}));

// Log işlemi yapan middleware
const loggerMiddleware = (req, res, next) => {
    winston.info(`${req.method} ${req.url}`, {
        params: req.params,
        query: req.query,
        body: req.body,
    });
    next();
};

module.exports = loggerMiddleware;
