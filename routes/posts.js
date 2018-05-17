const express = require("express");
const router = express.Router();
const expressSanitizer = require("express-sanitizer");
const Posts = require("../models/posts");
const Comment = require("../models/comment");
const middleware = require("../middleware");

const {
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
router.post("/", middleware.isLoggedIn, upload.single("image"), function (
  req,
  res
) {
  cloudinary.v2.uploader.upload(req.file.path, {
    width: 600,
    height: 400,
    crop: "fill"
  }, function (err, result) {
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
    // eval(require('locus'))
    Posts.create(req.body.post, function (err, post) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      console.log("Public ID" + req.body.post.imageId);
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
router.get("/:id/edit", isLoggedIn, middleware.checkUserPost, function (req, res) {
  console.log("IN EDIT!");
  //find the post with provided ID
  Posts.findById(req.params.id, function (err, foundPosts) {
    if (err) {
      console.log(err);
    } else {
      //render show template with that post
      res.render("posts/edit", {
        post: foundPosts
      });
    }
  });
});

// router.put("/:id", upload.single('image'),
//   function (req, res) {
//     Posts.findById(req.params.id, async function (err, post) {
//       if (err) {
//         req.flash("error", err.message);
//         res.redirect("back");
//       } else {
//         if (req.file) {
//           try {
//             await cloudinary.v2.uploader.destroy(post.imageId);
//             var result = await cloudinary.v2.uploader.upload(req.file.path);
//             post.imageId = result.public_id;
//             post.image = result.secure_url;
//           } catch (err) {
//             req.flash("error", err.message);
//             return res.redirect("back");
//           }
//         }
//         post.title = req.body.title;
//         post.body = req.body.body;
//         post.tag1 = req.body.tag1;
//         post.tag2 = req.body.tag2;
//         post.tag3 = req.body.tag3;
//         post.tag4 = req.body.tag4;
//         post.status = req.body.status;
//         post.alt = req.body.alt;
//         post.isPrimary = req.body.isPrimary;
//         post.save();
//         req.flash("success", "Successfully Updated This Post.");
//         res.redirect("/posts/" + post._id);
//       }
//     });
//   });

// router.delete('/:id', isLoggedIn, function (req, res) {
//   Posts.findById(req.params.id, async function (err, post) {
//     // eval(require('locus'))

//     if (err) {
//       req.flash("error", err.message);
//       return res.redirect("back");
//     }
//     try {
//       await cloudinary.v2.uploader.destroy(post.imageId);
//       post.remove();
//       req.flash('success', 'Post deleted successfully!');
//       res.redirect('/posts');
//       console.log("POST HAD BEEN DELETED FINALLY!");
//     } catch (err) {
//       if (err) {
//         req.flash("error", err.message);
//         return res.redirect("back");
//       }
//     }
//   });
// });

module.exports = router;

//HEROKU ERROR ==========================================
// 2018-05-17T16:36:31.703482+00:00 app[web.1]: /app/routes/posts.js:192
// 2018-05-17T16:36:31.703512+00:00 app[web.1]: Posts.findById(req.params.id, async function (err, post) {
// 2018-05-17T16:36:31.703514+00:00 app[web.1]: ^^^^^
// 2018-05-17T16:36:31.703515+00:00 app[web.1]: SyntaxError: missing ) after argument list

//HEROKU ERROR IF DELETE COMMENTED OUT AND ONLY ID AVAILABLE
// 2018-05-17T16:56:57.081919+00:00 app[web.1]: /app/routes/posts.js:159
// 2018-05-17T16:56:57.081950+00:00 app[web.1]: Posts.findById(req.params.id, async function (err, post) {
// 2018-05-17T16:56:57.081952+00:00 app[web.1]: ^^^^^
// 2018-05-17T16:56:57.081953+00:00 app[web.1]: SyntaxError: missing ) after argument list