const dotenv = require("dotenv")
const { resolve, join } = require("path")

dotenv.config({ path: resolve(__dirname, ".env") })

const ROOT_DIR = __dirname

module.exports = {
    PRIVATE_KEY: `${process.env["PRIVATE_KEY"]}`,
    ROOT_DIR
}
