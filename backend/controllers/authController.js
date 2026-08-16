const User = require("../models/user");
const Conversation = require("../models/conversation");
const sendOtpToMail = require("../service/emailService");
const otpGenerate = require("../utils/otpGenerator");
const twilioService = require("../service/twilioService");
const response = require("../utils/responseHandler");
const generateToken = require("../utils/generateToken");
const { uploadFileToClodinary } = require("../config/cloudinaryConfig");


const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;
    try {
        if (email) {
            user = await User.findOne({ email });

            if (!user) {
                user = new User({ email });
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();
            await sendOtpToMail(email, otp);

            return res.status(200).json({
                success: true,
                message: "Otp send to your email",
                data: email
            });
            // return response(res, 200, 'Otp send to your email', { email });
        }
        if (!phoneNumber || !phoneSuffix) {
            return res.status(400).json({
                success: false,
                message: "Phone number and phone suffix are required",
            });
            // return response(res, 400, 'Phone number and phone suffix are required');
        }

        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = await new User({ phoneNumber, phoneSuffix });
        }
        await user.save();
        await twilioService.sendOtpToPhoneNummber(fullPhoneNumber);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

// step - 2 verify otp 

const verifyOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body;
    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, Message: "User not found" })
            }
            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return res.status(400).json({ success: false, message: "Envailid or expired OTP" });
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        }
        else {
            if (!phoneNumber || !phoneSuffix) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number and phone suffix are required",
                });
            }
            const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({ phoneNumber });
            if (!user) {
                return res.status(404).json({ message: "User Not found" });
            }
            const result = await twilioService.verifyOtp(fullPhoneNumber, otp);
            if (result.status !== 'approved') {
                return res.status(400).json({ message: "Invalid Otp !" });
            }
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user?._id);
        // res.cookie("auth_token", token, {
        //     httpOnly: true,
        //     maxAge: 1000 * 60 * 60 * 24 * 365
        // });

        return res.status(200).json({ success: true, message: "Otp verified successfully !", token, data: user })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body;

    const userId = req.user.userId;
    try {
        const user = await User.findById(userId);
        const file = req.file;
        if (file) {
            const uploadResult = await uploadFileToClodinary(file);
            console.log(uploadResult);
            user.profilePicture = uploadResult?.secure_url;
        } else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        if (username) {
            user.username = username;
        }
        if (agreed) {
            user.agreed = agreed;
        }
        if (about) {
            user.about = about;
        }
        await user.save();
        console.log(user);
        return res.status(200).json({
            success: true,
            message: "User profile updated successfully !",
            user,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

const checkAuthrization = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(404).json({
                success: false,
                message: "Unauthorization, please login before access our app !"
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found !"
            });
        }
        return res.status(200).json({
            success: true,
            message: "User athorization successfully !",
            user
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) });
        return res.status(200).json({
            success: true,
            message: "User logout succesfully !"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

const getAllusers = async (req, res) => {
    const loggedInUser = req.user.userId;

    try {
        const users = await User.find({ _id: { $ne: loggedInUser } }).select
            ("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix").lean();

        const usersWithConversation = await Promise.all
            (users.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedInUser, user?._id] }
                }).populate({
                    path: "lastMessage",
                    select: "content createdAt sender receiver"
                }).lean();

                return {
                    ...user,
                    conversation: conversation || null,
                }
            })
            )
        console.log(usersWithConversation)

        return res.status(200).json({
            success: true,
            message: "User retrieved succesfully!",
            data: usersWithConversation
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error !"
        });
    }
}

module.exports = { sendOtp, verifyOtp, updateProfile, checkAuthrization, logout, getAllusers };