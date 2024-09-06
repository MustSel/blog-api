"use strict";
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */

// Comment Controllers:

const Comment = require("../models/comment");
const Blog = require("../models/blog");
const User = require("../models/user");

module.exports = {
  list: async (req, res) => {
    /*
        #swagger.tags = ["Comments"]
        #swagger.summary = "List Comments"
        #swagger.description = "List all comments or filter by blogId"
        #swagger.parameters['blogId'] = {
            in: 'query',
            description: 'Filter comments by Blog ID',
            required: false,
            schema: {
                type: 'string'
            }
        }
    */
    const data = await res.getModelList(Comment, {}, [
      { path: "userId", select: "username" },
    ]);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Comment),
      data,
    });
  },

  create: async (req, res) => {
    /*
        #swagger.tags = ["Comments"]
        #swagger.summary = "Create Comment"
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $ref: "#/definitions/Comment"
            }
        }
    */

    req.body.userId = req.user._id;
    const { userId, blogId, comment } = req.body;

    if (!userId || !blogId || !comment) {
      return res.status(400).send({
        error: true,
        message: "blogId and comment are required.",
      });
    }
    delete req.body.createdAt;
    delete req.body.updatedAt;

    const data = await Comment.create(req.body);

    await Blog.findByIdAndUpdate(blogId, {
      $push: { comments: data._id },
  });

    // Yeni eklenen comment verisini populate işlemiyle birlikte alıyoruz
    const populatedData = await Comment.findById(data._id).populate('userId', 'username image');
    
    res.status(201).send({
      error: false,
      data: populatedData,
    });
  },

  read: async (req, res) => {
    /*
        #swagger.tags = ["Comments"]
        #swagger.summary = "Get Single Comment"
    */

    const comment = await Comment.findOne({ _id: req.params.id }).populate([
      { path: "userId", select: "_id username" },
      { path: "blogId", select: "_id title" },
    ]);

    if (!comment) {
      return res.status(404).send({
        error: true,
        message: "Comment not found.",
      });
    }

    res.status(200).send({
      error: false,
      data: comment,
    });
  },

  update: async (req, res) => {
    /*
        #swagger.tags = ["Comments"]
        #swagger.summary = "Update Comment"
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $ref: "#/definitions/Comment"
            }
        }
    */

    const { comment } = req.body;

    const existingComment = await Comment.findOne({ _id: req.params.id });

    if (!existingComment) {
      return res.status(404).send({
        error: true,
        message: "Comment not found.",
      });
    }

    const user = await User.findById(req.user._id);

    if (
      !user ||
      (!user.isAdmin &&
        existingComment.userId.toString() !== req.user._id.toString())
    ) {
      return res.status(403).send({
        error: true,
        message: "You do not have permission to update this comment.",
      });
    }

    delete req.body.userId;
    delete req.body.createdAt;
    delete req.body.updatedAt;

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: req.params.id },
      { comment },
      { new: true, runValidators: true }
    );

    res.status(200).send({
      error: false,
      data: updatedComment,
    });
  },

  delete: async (req, res) => {
    /*
        #swagger.tags = ["Comments"]
        #swagger.summary = "Delete Comment"
    */

    
    const comment = await Comment.findOne({ _id: req.params.id });

    if (!comment) {
        return res.status(404).send({
            error: true,
            message: "Comment not found.",
        });
    }

    
    const user = await User.findById(req.user._id);

    if (
        !user ||
        (!user.isAdmin && comment.userId.toString() !== req.user._id.toString())
    ) {
        return res.status(403).send({
            error: true,
            message: "You do not have permission to delete this comment.",
        });
    }

    
    await Comment.deleteOne({ _id: req.params.id });

    
    await Blog.findByIdAndUpdate(comment.blogId, {
        $pull: { comments: req.params.id },
    });

    return res.status(204).send(); 
},

};
