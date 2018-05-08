var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String
  },
  avatar: {
    type: String,
    required: false
  },
  email: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

var requiredAttrs = ['username', 'email'];

for (attr in requiredAttrs) {
  schema[attr].required = true;
}

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);