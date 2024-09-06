"use strict"
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
const router = require('express').Router()
/* ------------------------------------------------------- */
// routes/category:

const category = require('../controllers/category')
const permissions = require('../middlewares/permissions')

// URL: /categorys

// router.use(permissions.isAdmin)

router.route('/')
    .get(category.list)
    .post(permissions.isAdmin, category.create)

router.route('/:id')
    .get(category.read)
    .put(permissions.isAdmin, category.update)
    .patch(permissions.isAdmin, category.update)
    .delete(permissions.isAdmin, category.delete)

/* ------------------------------------------------------- */
// Exports:
module.exports = router