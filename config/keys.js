if (process.env.NODE_ENV === "production") {
  module.exports = require("./keys_prod");
} else {
  module.exports = require("./keys_dev");
}

// module.exports = {
//   googleClientID:
//     "822570313051-oq86fi6ljapku4e0csesphukbueqkqam.apps.googleusercontent.com",
//   googleClientSecret: "Kj1jjetb3p38tH_tQMU65-jE"
// };
