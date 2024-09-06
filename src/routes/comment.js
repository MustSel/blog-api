"use strict"
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
const router = require('express').Router()
/* ------------------------------------------------------- */
// routes/category:

const comment = require('../controllers/comment')
const permissions = require('../middlewares/permissions')

// URL: /comments


router.route('/')
    .get(comment.list)
    .post(permissions.isLogin, comment.create)

router.route('/:id')
    .get(permissions.isLogin, comment.read)
    .put(permissions.isLogin, comment.update)
    .patch(permissions.isLogin, comment.update)
    .delete(permissions.isLogin, comment.delete)


/* ------------------------------------------------------- */
// Exports:
module.exports = router