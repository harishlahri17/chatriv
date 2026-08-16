const express = require("express");
const route = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");



const { createStatus, getStatus, statusViews, deleteStatus, } = require("../controllers/statusController");
// protected route 
route.post("/",authMiddleware, multerMiddleware, createStatus);
route.get("/", authMiddleware, getStatus);

route.put("/:statusId/view", authMiddleware, statusViews);
route.delete("/:statusId", authMiddleware, deleteStatus);

module.exports = route;