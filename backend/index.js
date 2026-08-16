const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const databaseConnection = require("./config/dbConnect");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");
const statusRoute = require("./routes/statusRoute");
const initializeSocket = require("./service/socketService");
const http = require("http");


databaseConnection();

const PORT = process.env.PORT;
const app = express();

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));


//cors connection
const corsOption = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}
app.use(cors(corsOption));


//create socket server 
const server = http.createServer(app)
const  io = initializeSocket(server);
app.use((req, resizeBy, next) => {
    req.io = io,
    req.socketUserMap = io.socketUserMap
    next();
})



// app.listen(PORT, () => {
//     console.log(`Server runnig on port ${PORT}`);
// })
server.listen(PORT, () => {
    console.log(`Server runnig on port ${PORT}`);
})

// routes 
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/status", statusRoute);
