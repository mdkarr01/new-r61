User
  .find({
    where: {
      email: req.body.email
    }
  })
  .then(function (existingUser) {
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.redirect('/signup');
    }
  }),