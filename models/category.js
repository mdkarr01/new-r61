var mongoose = require("mongoose");

var categorySchema = new mongoose.Schema({

    tags: {
        type: String,
        dropdown: [{
                name: "Rock",
                value: "Rock"
            },
            {
                name: "Blues",
                value: "Blues"
            },
            {
                name: "Folk",
                value: "Folk"
            },
            {
                name: "Country",
                value: "Country"
            },
            {
                name: "Live",
                value: "Live"
            },
        ]
    },
});

module.exports = mongoose.model("Category", categorySchema);