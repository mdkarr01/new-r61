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
    required: true,
    lowercase: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: {
    type: Boolean,
    default: false
  },
  tag1: String,
  tag2: String,
  tag3: String,
  tag4: String
});


// UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameQueryFields: ['email']
});

module.exports = mongoose.model("User", UserSchema);