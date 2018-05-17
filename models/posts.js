var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    image: String,
    alt: String,
    imageId: String,
    body: {
        type: String,
        required: true
    },
    // location: String,
    // lat: Number,
    // lng: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPrimary: {
        type: String,
        default: 'No'
    },
    status: {
        type: String,
        default: 'Yes'
    },
    tag1: {
        type: String
    },
    tag2: {
        type: String
    },
    tag3: {
        type: String
    },
    tag4: {
        type: String
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatar: String
    },
    tags: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        },
        tags: String,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

module.exports = mongoose.model("Posts", postSchema);