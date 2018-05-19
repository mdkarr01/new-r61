var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  cookieParser = require("cookie-parser"),
  truncate = require('truncate'),
  expressSanitizer = require("express-sanitizer"),
  LocalStrategy = require("passport-local"),
  exphbs = require("express-handlebars"),
  flash = require("connect-flash"),
  Posts = require("./models/posts"),
  Comment = require("./models/comment"),
  User = require("./models/user"),
  session = require("express-session"),
  seedDB = require("./seeds"),
  validator = require('express-validator'),
  helmet = require('helmet'),
  methodOverride = require("method-override");
// configure dotenv
require("dotenv").load();

//Where is this? resize = require("./resize"); requiring routes
var commentRoutes = require("./routes/comments"),
  postRoutes = require("./routes/posts"),
  indexRoutes = require("./routes/index");

// PASSPORT CONFIG require("./config/passport")(passport); If using
// config/database for production and dev databases const db =
// require('./config/database'); assign mongoose promise library and connect to
// database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI;

mongoose
  .connect(databaseUri, {
    useMongoClient: true
  })
  .then(() => console.log(`Database connected`))
  .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressSanitizer());

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(methodOverride("_method"));

app.use(cookieParser("secret"));

app.use(validator());

app.use(helmet());

//require moment
app.locals.moment = require("moment");

//require text-clipper
app.locals.clip = require("text-clipper");

// seedDB(); //seed the database PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "Nellie is a sweetheart!",
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", indexRoutes);
app.use("/posts", postRoutes);
app.use("/posts/:id/comments", commentRoutes);

// app.listen(process.env.PORT, process.env.IP, function () {
//   console.log("The Route 61 Server Has Started!");
// });
const port = 3000;

app.listen(port, () => {
  console.log("The Route 61 Server Has Started!");
});