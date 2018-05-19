const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Posts = require("../models/posts");
const middleware = require("../middleware");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const validator = require('express-validator');
// const csrf = require('csurf');
// var csrfProtection = csrf({
//   cookie: true
// });


const {
  matchedData
} = require('express-validator/filter');
const {
  check,
  validationResult
} = require('express-validator/check')
const request = require("request");
const multer = require("multer");
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
const upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "michael-karr",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//root route
router.get("/", function (req, res) {
  res.render("landing");
});

//ABOUT PORT
router.get('/about', (res, req) => {
  res.sendStatus(200);
});

//Contact form
router.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
    // csrfToken: req.csrfToken()
  })
})

router.post('/contact', [
  check('name')
  .not().isEmpty()
  .withMessage('Name is required')
  .trim(),
  check('message')
  .not().isEmpty()
  .withMessage('Message is required')
  .trim(),
  check('email')
  .isEmail()
  .withMessage('That email doesn‘t look right')
  .trim()
  .normalizeEmail()
], (req, res) => {
  // req.assert('password', 'Password is required').notEmpty();
  // req.check("password", "...").matches(^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+]{5,20}$, "i");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('contact', {
      data: req.body,
      errors: errors.mapped(),
      // csrfToken: req.csrfToken()
    })
  }
  const data = matchedData(req);
  console.log('Sanitized:', data);

  if (req.body) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: 'mdkarr01@gmail.com',
      from: {
        email: 'no-reply@michaelkarr.net'
      },
      subject: 'Contact Form: Route61',
      content: [{
        type: 'text/plain',
        value: `
        You have received a contact us form submission. Here is the data:
        Email: ${req.body.email}
        Name: ${req.body.name}
        Phone: ${req.body.phone}
        Message: ${req.body.message}
      `
      }]
    };
    // eval(require('locus'))
    sgMail.send(msg);
  } else {
    req.flash('failure', 'There was a problem sending your message. Please try again.');
  }
  req.flash('success', 'Thanks for the message! I‘ll be in touch.');
  res.redirect("/posts");
});

// show register form
router.get("/register", function (req, res) {
  res.render("register", {
    page: "register"
  });
});

router.post("/register", function (req, res) {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });

  if (req.body.adminCode === 'secretcode123') {
    newUser.isAdmin = true;
  }

  if (req.body.password != req.body.password2) {
    req.flash('failure', 'Oh no!');
    // return res.render("register");
  }

  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render("register", {
        error: err.message
      });
    }
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
      res.redirect("/posts");
    });
  });
});

//show login form
router.get("/login", function (req, res) {
  res.render("login", {
    page: "login"
  });
});

// handling login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/posts",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome to Route 61!"
  }),
  function (req, res) {}
);

// logout route
router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "See Ya!");
  res.redirect("/posts");
});

// forgot password
router.get("/forgot", function (req, res) {
  res.render("forgot");
});

router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({
            email: req.body.email
          },
          function (err, user) {
            if (!user) {
              req.flash("error", "No account with that email address exists.");
              return res.redirect("/forgot");
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function (err) {
              done(err, token, user);
            });
          }
        );
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "michaelkarrnet@gmail.com",
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: "michaelkarrnet@gmail.com",
          subject: "Node.js Password Reset",
          text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
            user.email +
            " with further instructions."
          );
          done(err, "done");
        });
      }
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset/:token", function (req, res) {
  User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset", {
        token: req.params.token
      });
    }
  );
});

router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
              $gt: Date.now()
            }
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "michaelkarrnet@gmail.com",
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: "learntocodeinfo@mail.com",
          subject: "Your password has been changed",
          text: "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n"
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      }
    ],
    function (err) {
      res.redirect("/posts");
    }
  );
});

// USER PROFILE
router.get("/users/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err) {
      req.flash("error", "Something went wrong.");
      return res.redirect("/");
    }
    Posts.find().where('author.id').equals(foundUser._id).exec(function (err, posts) {
      if (err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      res.render("users/show", {
        user: foundUser,
        posts: posts
      });
    })
  });
});

module.exports = router;

// 2018-05-19T18:46:52.915828+00:00 app[web.1]: /app/routes/posts.js:185
// 2018-05-19T18:46:52.915865+00:00 app[web.1]: Posts.findById(req.params.id, async function (err, post) {
// 2018-05-19T18:46:52.915868+00:00 app[web.1]: ^^^^^
// 2018-05-19T18:46:52.915869+00:00 app[web.1]: SyntaxError: missing ) after argument list