const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const randomstring = require("randomstring");
// Load user model
const User = require("../models/user");

module.exports = function(passport) {
  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },

      function(req, email, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.findOne(
            {
              "local.email": email
            },
            function(err, user) {
              // if there are any errors, return the error
              if (err) {
                return done(err);
              }

              // check to see if theres already a user with that email
              if (user) {
                console.log("that email exists");
                return done(
                  null,
                  false,
                  req.flash("signupMessage", email + " is already in use. ")
                );
              } else {
                User.findOne(
                  {
                    "local.username": req.body.username
                  },
                  function(err, user) {
                    if (user) {
                      console.log("That username exists");
                      return done(
                        null,
                        false,
                        req.flash(
                          "signupMessage",
                          "That username is already taken."
                        )
                      );
                    }

                    if (req.body.password != req.body.confirm_password) {
                      console.log("Passwords do not match");
                      return done(
                        null,
                        false,
                        req.flash(
                          "signupMessage",
                          "Your passwords do not match"
                        )
                      );
                    } else {
                      // create the user
                      var newUser = new User();

                      var permalink = req.body.username
                        .toLowerCase()
                        .replace(" ", "")
                        .replace(/[^\w\s]/gi, "")
                        .trim();

                      var verification_token = randomstring.generate({
                        length: 64
                      });

                      newUser.local.email = email;

                      newUser.local.password = newUser.generateHash(password);

                      newUser.local.permalink = permalink;

                      //Verified will get turned to true when they verify email address
                      newUser.local.verified = false;
                      newUser.local.verify_token = verification_token;

                      try {
                        newUser.save(function(err) {
                          if (err) {
                            throw err;
                          } else {
                            VerifyEmail.sendverification(
                              email,
                              verification_token,
                              permalink
                            );
                            return done(null, newUser);
                          }
                        });
                      } catch (err) {
                        throw err;
                      }
                    }
                  }
                );
              }
            }
          );
        });
      }
    )
  );
};
