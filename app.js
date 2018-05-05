var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  cookieParser = require("cookie-parser"),
  LocalStrategy = require("passport-local"),
  exphbs = require("express-handlebars"),
  flash = require("connect-flash"),
  resize = require('resize'),
  Posts = require("./models/posts"),
  Comment = require("./models/comment"),
  User = require("./models/user"),
  session = require("express-session"),
  seedDB = require("./seeds"),
  methodOverride = require("method-override");
// configure dotenv
require("dotenv").load();

//requiring routes
var commentRoutes = require("./routes/comments"),
  postRoutes = require("./routes/posts"),
  indexRoutes = require("./routes/index");

// var {
//   truncate,
//   stripTags,
//   formatDate,
//   select,
//   editIcon
// } = require("./helpers/hbs");

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI;

mongoose
  .connect(databaseUri, {
    useMongoClient: true
  })
  .then(() => console.log(`Database connected`))
  .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
// // Handlebars Middleware
// app.engine(
//   "handlebars",
//   exphbs({
//     helpers: {
//       truncate: truncate,
//       stripTags: stripTags,
//       formatDate: formatDate,
//       select: select,
//       editIcon: editIcon
//     },
//     defaultLayout: "main"
//   })
// );
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(methodOverride("_method"));

app.use(cookieParser("secret"));


//require moment
app.locals.moment = require("moment");
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(
  require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
  })
);

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

// const port = (process.env.PORT, process.env.IP);
const port = 3000;


app.listen(port, () => {
  console.log("The Route 61 Server Has Started!");
});