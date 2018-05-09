var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    tags: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'public'
    },
    tag1: String,
    tag2: String,
    tag3: String,
    tag4: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatar: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

module.exports = mongoose.model("Posts", postSchema);