router.put("/:id", isLoggedIn, upload.single('image'),
    function (req, res) {
        Posts.findById(req.params.id, async function (err, post) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                if (req.file) {
                    try {
                        await cloudinary.v2.uploader.destroy(post.imageId);
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                        post.imageId = result.public_id;
                        post.image = result.secure_url;
                    } catch (err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                }
                post.title = req.body.title;
                post.body = req.body.body;
                post.tag1 = req.body.tag1;
                post.tag2 = req.body.tag2;
                post.tag3 = req.body.tag3;
                post.tag4 = req.body.tag4;
                post.status = req.body.status;
                post.alt = req.body.alt;
                post.isPrimary = req.body.isPrimary;
                post.save();
                req.flash("success", "Successfully Updated This Post.");
                res.redirect("/posts/" + post._id);
            }
        });
    });