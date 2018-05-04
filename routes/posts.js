var express = require("express");
var router = express.Router();
var Posts = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require("geocoder");
var {
    isLoggedIn,
    checkUserCampground,
    checkUserComment,
    isAdmin,
    isSafe
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
        Posts.find({
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
        Posts.find({}, function (err, allCampgrounds) {
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

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single("image"), function (
    req,
    res
) {
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.post.image = result.secure_url;
        // add image's public_id to post object
        req.body.post.imageId = result.public_id;
        // add author to post
        req.body.post.author = {
            id: req.user._id,
            username: req.user.username
        };
        Posts.create(req.body.campground, function (err, post) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            res.redirect("/posts/" + post.id);
        });
    });
});

//NEW - show form to create new campground
router.get("/new", isLoggedIn, function (req, res) {
    res.render("posts/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Posts.findById(req.params.id)
        .populate("comments")
        .exec(function (err, foundPosts) {
            if (err || !foundPosts) {
                console.log(err);
                req.flash("error", "Sorry, that post does not exist!");
                return res.redirect("/posts");
            }
            console.log(foundPosts);
            //render show template with that campground
            res.render("posts/show", {
                campground: foundPosts
            });
        });
});

// EDIT - shows edit form for a campground
router.get("/:id/edit", isLoggedIn, checkUserCampground, function (req, res) {
    //render edit template with that campground
    res.render("posts/edit", {
        campground: req.campground
    });
});

// PUT - updates campground in the database
router.put("/:id", isSafe, function (req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {
            name: req.body.name,
            image: req.body.image,
            body: req.body.body,
            cost: req.body.cost,
            location: location,
            lat: lat,
            lng: lng
        };
        Posts.findByIdAndUpdate(req.params.id, {
            $set: newData
        }, function (
            err,
            campground
        ) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully Updated!");
                res.redirect("/posts/" + campground._id);
            }
        });
    });
});

// DELETE - removes campground and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCampground, function (req, res) {
    Comment.remove({
            _id: {
                $in: req.campground.comments
            }
        },
        function (err) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/");
            } else {
                req.campground.remove(function (err) {
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

module.exports = router;