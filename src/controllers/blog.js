"use strict";
/* -------------------------------------------------------
    | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */

// Blog Controllers:

const Blog = require("../models/blog");
const User = require("../models/user");
const Comment = require("../models/comment");

module.exports = {
  list: async (req, res) => {
    /*
      #swagger.tags = ["Blogs"]
      #swagger.summary = "List Blogs"
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
  
    try {
      const { author, filter = {} } = req.query;
  
      let queryFilter = {};
      if (author || filter.userId) {
        queryFilter = author ? { userId: author } : { userId: filter.userId };
      } else {
        queryFilter = { isPublish: true };
      }
  
      // Blogları getir
      const data = await res.getModelList(Blog, queryFilter, [
        { path: "userId", select: "username image" },
        { path: "categoryId", select: "name" },
      ]);
      const details = await res.getModelListDetails(Blog, queryFilter);
  
      res.status(200).send({
        error: false,
        details,
        data,
      });
    } catch (error) {
      res.status(500).send({
        error: true,
        message: error.message,
      });
    }
  },

  create: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Create Blog"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref: "#/definitions/Blog"
                }
            }
        */

    try {
      const { categoryId, title, content } = req.body;

      req.body.userId = req.user._id;
      if (!categoryId || !title || !content) {
        return res.status(400).send({
          error: true,
          message: "categoryId, title, and content are required.",
        });
      }

      delete req.body.likes;
      delete req.body.countOfVisitors;
      delete req.body.createdAt;
      delete req.body.updatedAt;

      const data = await Blog.create(req.body);
      res.status(201).send({
        error: false,
        data,
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },

  read: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Get Single Blog"
        */

    try {
      const blog = await Blog.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { countOfVisitors: 1 } },
        { new: true }
      ).populate([
        { path: "userId", select: "_id username image" },
        { 
          path: "comments", 
          populate: { 
            path: "userId", 
            select: "_id username image"
          }
        },
        "categoryId"
      ]);

      if (!blog) {
        return res
          .status(404)
          .send({ error: true, message: "Blog not found." });
      }

      res.status(200).send({
        error: false,
        data: blog,
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },

  update: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Update Blog"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref: "#/definitions/Blog"
                }
            }
        */

    try {
      const blog = await Blog.findOne({ _id: req.params.id });

      if (!blog) {
        return res
          .status(404)
          .send({ error: true, message: "Blog not found." });
      }

      const user = await User.findById(req.user._id);

      if (
        !user ||
        (!user.isAdmin && blog.userId.toString() !== req.user._id.toString())
      ) {
        return res.status(403).send({
          error: true,
          message: "You do not have permission to update this blog.",
        });
      }

      delete req.body.userId;
      delete req.body.likes;
      delete req.body.countOfVisitors;
      delete req.body.createdAt;
      delete req.body.updatedAt;

      const data = await Blog.updateOne({ _id: req.params.id }, req.body, {
        runValidators: true,
      });

      res.status(202).send({
        error: false,
        data,
        new: await Blog.findOne({ _id: req.params.id }),
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },

  delete: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Delete Blog"
        */

    try {
      const blog = await Blog.findOne({ _id: req.params.id });

      if (!blog) {
        return res
          .status(404)
          .send({ error: true, message: "Blog not found." });
      }

      const user = await User.findById(req.user._id);

      if (
        !user ||
        (!user.isAdmin && blog.userId.toString() !== req.user._id.toString())
      ) {
        return res.status(403).send({
          error: true,
          message: "You do not have permission to delete this blog.",
        });
      }

      const data = await Blog.deleteOne({ _id: req.params.id });
      await Comment.deleteMany({ blogId: req.params.id });

      res.status(data.deletedCount ? 204 : 404).send({
        error: !data.deletedCount,
        data,
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },

  getLike: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Get Like Status"
            #swagger.parameters['id'] = {
                in: 'path',
                required: true,
                description: 'Blog ID'
            }
        */

    try {
      const userId = req.user._id; // Mevcut kullanıcı ID'sini alın
      const blog = await Blog.findOne({ _id: req.params.id });

      if (!blog) {
        return res
          .status(404)
          .send({ error: true, message: "Blog not found." });
      }

      const didUserLike = blog.likes.includes(userId);
      const countOfLikes = blog.likes.length;

      res.status(200).send({
        error: false,
        didUserLike,
        countOfLikes,
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },

  postLike: async (req, res) => {
    /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Post Like / Unlike"
            #swagger.parameters['id'] = {
                in: 'path',
                required: true,
                description: 'Blog ID'
            }
        */

    try {
      const userId = req.user._id; // Mevcut kullanıcı ID'sini alın
      const blog = await Blog.findOne({ _id: req.params.id });

      if (!blog) {
        return res
          .status(404)
          .send({ error: true, message: "Blog not found." });
      }

      const liked = blog.likes.includes(userId);

      if (liked) {
        // Kullanıcı daha önce beğenmişse beğeniyi kaldır
        blog.likes.pull(userId);
      } else {
        // Kullanıcı beğenmemişse beğeniyi ekle
        blog.likes.push(userId);
      }

      await blog.save();

      res.status(200).send({
        error: false,
        didUserLike: !liked, // Kullanıcının yeni beğeni durumu
        countOfLikes: blog.likes.length,
      });
    } catch (error) {
      res.status(500).send({ error: true, message: error.message });
    }
  },
};
