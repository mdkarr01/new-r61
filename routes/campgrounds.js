var express = require("express");
var router = express.Router();
var Posts = require("../models/posts");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require("geocoder");
var {
  isLoggedIn,
  checkUserPost,
  checkUserComment,
  isAdmin
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
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

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
    Post.find({
      name: regex
    }, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        res.status(200).json(allCampgrounds);
      }
    });
  } else {
    // Get all posts from DB
    Post.find({}, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        if (req.xhr) {
          res.json(allCampgrounds);
        } else {
          res.render("posts/index", {
            posts: allCampgrounds,
            page: "posts"
          });
        }
      }
    });
  }
});

//CREATE - add new post to DB
router.post("/", middleware.isLoggedIn, upload.single("image"), function (
      req,
      res
    ) {
      cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        // add cloudinary url for the image to the post object under image property
        req.body.post.image = result.secure_url;
        // add image's public_id to post object
        req.body.post.imageId = result.public_id;
        // add author to post
        req.body.post.author = {
          id: req.user._id,
          username: req.user.username
        };
        geocoder.geocode(req.body.location, function (err, data) {
          if (err || data.status === 'ZERO_RESULTS') {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
          }
          var lat = data.results[0].geometry.location.lat;
          var lng = data.results[0].geometry.location.lng;
          var location = data.results[0].formatted_address;
          Post.create(req.body.post, req.body.location, function (err, post) {
            if (err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
            res.redirect("/posts/" + post.id);
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
        Post.findById(req.params.id)
          .populate("comments")
          .exec(function (err, foundCampground) {
            if (err || !foundCampground) {
              console.log(err);
              req.flash("error", "Sorry, that post does not exist!");
              return res.redirect("/posts");
            }
            console.log(foundCampground);
            //render show template with that post
            res.render("posts/show", {
              post: foundCampground
            });
          });
      });

      // EDIT - shows edit form for a post
      router.get("/:id/edit", middleware.checkUserCampground, function (req, res) {
        console.log("IN EDIT!");
        //find the post with provided ID
        Posts.findById(req.params.id, function (err, foundPost) {
          if (err) {
            console.log(err);
          } else {
            //render show template with that post
            res.render("posts/edit", {
              post: foundPost
            });
          }
        });
      });

      // PUT - updates post in the database
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
            post.name = req.body.name;
            post.description = req.body.description;
            post.save();
            req.flash("success", "Successfully Updated!");
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
                req.flash("error", "Post deleted!");
                res.redirect("/posts");
              });
            }
          }
        );
      });

      module.exports = router;