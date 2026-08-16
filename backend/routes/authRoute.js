const express = require("express");
const route = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");


const { sendOtp, verifyOtp, updateProfile, logout, checkAuthrization, getAllusers } = require("../controllers/authController");
route.post("/send-otp", sendOtp);
route.post("/verify-otp", verifyOtp);
route.get("/logout", logout);

// protected route 
route.put("/update-profile", authMiddleware, multerMiddleware, updateProfile);
route.post("/check-auth", authMiddleware, checkAuthrization);
route.get("/users", authMiddleware, getAllusers);


module.exports = route;
