"use strict"
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */
const { mongoose } = require('../configs/dbConnection')
/* ------------------------------------------------------- */

// Category Model:

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true
    }
},{
    collection: 'categories',
    timestamps: true
})


/* ------------------------------------------------------- */
module.exports = mongoose.model('Category', CategorySchema)