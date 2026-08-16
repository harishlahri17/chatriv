const express = require("express");
const route = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");



const { sendMessage, getConversation, getMessages, marksAsRead, deleteMessage } = require("../controllers/chatController");
// protected route 
route.post("/send-message", multerMiddleware, sendMessage);
route.get("/conversations", authMiddleware, getConversation);
route.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

route.put("/messages/read", authMiddleware, marksAsRead);
route.delete("/messages/:messageId", authMiddleware, deleteMessage);



module.exports = route;