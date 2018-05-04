var Comment = require('../models/comment');
var Post = require('../models/posts');
module.exports = {
  isLoggedIn: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'You must be signed in to do that!');
    res.redirect('/login');
  },
  checkUserPost: function (req, res, next) {
    Post.findById(req.params.id, function (err, foundPost) {
      if (err || !foundPost) {
        console.log(err);
        req.flash('error', 'Sorry, that post does not exist!');
        res.redirect('/posts');
      } else if (foundPost.author.id.equals(req.user._id) || req.user.isAdmin) {
        req.post = foundPost;
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.redirect('/posts/' + req.params.id);
      }
    });
  },
  checkUserComment: function (req, res, next) {
    Comment.findById(req.params.commentId, function (err, foundComment) {
      if (err || !foundComment) {
        console.log(err);
        req.flash('error', 'Sorry, that comment does not exist!');
        res.redirect('/posts');
      } else if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
        req.comment = foundComment;
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.redirect('/posts/' + req.params.id);
      }
    });
  },
  isAdmin: function (req, res, next) {
    if (req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  }
  // isSafe: function (req, res, next) {
  //   if (req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
  //     next();
  //   } else {
  //     req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
  //     res.redirect('back');
  //   }
  // }
}