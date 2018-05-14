var express = require("express");
var router = express.Router();
var Posts = require("../models/posts");
var path = require('path');
var Comment = require("../models/comment");
var middleware = require("../middleware");
var sharp = require("sharp");
var {
  isLoggedIn,
  checkUserPost,
  checkUserComment,
  isAdmin,
  select,
} = middleware; // destructuring assignment

var request = require("request");
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
})

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "michael-karr",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

//INDEX - show all posts
router.get("/", function (req, res) {
  if (req.query.search && req.xhr) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    // Get all posts from DB
    Posts.find({
        tag1: regex
      },
      function (err, allPosts) {
        if (err) {
          console.log(err);
        } else {
          res.status(200).json(allPosts);
        }
      }
    );
  } else {
    // Get all posts from DB
    Posts.find({}, function (err, allPosts) {
      if (err) {
        console.log(err);
      } else {
        if (req.xhr) {
          res.json(allPosts);
        } else {
          res.render("posts/index", {
            posts: allPosts,
            page: "posts"
          });
        }
      }
    });
  }
});

//CREATE - add new post to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
  cloudinary.uploader.upload(req.file.path, function (result) {
    // add cloudinary url for the image to the post object under image property
    req.body.post.image = result.secure_url;
    // add author to post
    req.body.post.author = {
      id: req.user._id,
      username: req.user.username
    }
    req.body.post.body = req.sanitize(req.body.post);
    Posts.create(req.body.post, function (err, post) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/posts/' + post.id);
    });
  });
});

//NEW - show form to create new post
router.get("/new", isLoggedIn, function (req, res) {
  res.render("posts/new");
});

// SHOW - shows more info about one post
router.get("/:id", function (req, res) {
  //find the post with provided ID
  Posts.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundPosts) {
      if (err || !foundPosts) {
        console.log(err);
        req.flash("error", "Sorry, that post does not exist!");
        return res.redirect("/posts");
      }
      console.log(foundPosts);
      //render show template with that post
      res.render("posts/show", {
        post: foundPosts
      });
    });
});

// EDIT - shows edit form for a post
router.get("/:id/edit", isLoggedIn, checkUserPost, function (req, res) {
  //render edit template with that post
  res.render("posts/edit", {
    post: req.post
  });
});

router.put("/:id", upload.single('image'), function (req, res) {
  Posts.findById(req.params.id, async function (err, post) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      if (req.file) {
        try {
          await cloudinary.v2.uploader.destroy(post.imageId);
          var result = await cloudinary.v2.uploader.upload(req.file.path);
          post.imageId = result.public_id;
          post.image = result.secure_url;
        } catch (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
      }
      post.title = req.body.title;
      post.body = req.body.body;
      post.tag1 = req.body.tag1;
      post.tag2 = req.body.tag2;
      post.tag3 = req.body.tag3;
      post.tag4 = req.body.tag4;
      post.status = req.body.status;
      post.alt = req.body.alt;
      post.isPrimary = req.body.isPrimary;
      post.save();
      req.flash("success", "Successfully Updated Post.");
      res.redirect("/posts/" + post._id);
    }
  });
});

// DELETE - removes post and its comments from the database
router.delete("/:id", isLoggedIn, checkUserPost, function (req, res) {
  Comment.remove({
      _id: {
        $in: req.post.comments
      }
    },
    function (err) {
      if (err) {
        req.flash("error", err.message);
        res.redirect("/");
      } else {
        req.post.remove(function (err) {
          if (err) {
            req.flash("error", err.message);
            return res.redirect("/");
          }
          req.flash("error", "Posts deleted!");
          res.redirect("/posts");
        });
      }
    }
  );
});

router.delete('/:id', isLoggedIn, checkUserPost, function (req, res) {
  Posts.findById(req.params.id, async function (err, post) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      await cloudinary.v2.uploader.destroy(post.imageId);
      post.remove();
      req.flash('success', 'Post deleted successfully!');
      res.redirect('/posts');
    } catch (err) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
    }
  });
});

module.exports = router;