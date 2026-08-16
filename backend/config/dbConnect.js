const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGODB_URI;
const databseConnection = async () => {
    mongoose.connect(mongoURI)
        .then(() => {
            console.log("Database connected Successfully !");
        })
        .catch((error) => {
            console.log("Database connection failed !");
        })
}
module.exports = databseConnection;