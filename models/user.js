// var mongoose = require("mongoose");
// var passportLocalMongoose = require("passport-local-mongoose");

// var UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true
//   },
//   password: {
//     type: String
//   },
//   firstName: {
//     type: String
//   },
//   lastName: {
//     type: String
//   },
//   avatar: {
//     type: String,
//     required: false
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   isAdmin: {
//     type: Boolean,
//     default: false
//   }
// });

// UserSchema.plugin(passportLocalMongoose);

// module.exports = mongoose.model("User", UserSchema);

var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  avatar: String,
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);