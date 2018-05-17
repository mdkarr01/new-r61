router.put("/:id", upload.single('image'), function (req, res) {
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
            post.name = req.body.name;
            post.description = req.body.description;
            post.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/posts/" + post._id);
        }
    });
});