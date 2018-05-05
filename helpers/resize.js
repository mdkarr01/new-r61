const fs = require('fs');

module.exports = function resize(path, format, width, height) {
    const readStream = fs.createReadStream(path);
    return readStream;
}