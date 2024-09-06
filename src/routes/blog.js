"use strict"
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
const router = require('express').Router()
/* ------------------------------------------------------- */
// routes/category:

const blog = require('../controllers/blog')
const permissions = require('../middlewares/permissions')

// URL: /blogs


router.route('/')
    .get(blog.list)
    .post(permissions.isLogin, blog.create)

router.route('/:id')
    .get(permissions.isLogin, blog.read)
    .put(permissions.isLogin, blog.update)
    .patch(permissions.isLogin, blog.update)
    .delete(permissions.isLogin, blog.delete)

router.route('/:id/getLike').get(permissions.isLogin, blog.getLike)
router.route('/:id/postLike').post(permissions.isLogin, blog.postLike)

/* ------------------------------------------------------- */
// Exports:
module.exports = router