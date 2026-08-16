const { uploadFileToClodinary } = require("../config/cloudinaryConfig");
const Status = require("../models/status");
const Message = require("../models/message");


const createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text';

        // handle file upload 
        if (file) {
            const uploadFile = await uploadFileToClodinary(file);

            if (!uploadFile?.secure_url) {
                return res.status(400).json({ success: false, message: " Failed to upload media" });
            }
            mediaUrl = uploadFile?.secure_url;

            if (file.mimetype.startsWith('image')) {
                finalContentType = "image"
            } else if (file.mimetype.startsWith('video')) {
                finalContentType = "video"
            } else {
                return res.status(400).json({ success: false, message: "File type not support" });
            }
        } else if (content?.trim()) {
            finalContentType = "text"
        } else {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }

        const expireAt = new Date();
        expireAt.setHours(expireAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expireAt,
        });
        await status.save();

        const populateStatus = await Status.findOne(status?._id)
            .populate("user", "username profilePicture")
            .populate("viewers.user", "username profilePicture")

        // emit socket event
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting user axcet the creater
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populateStatus)
                }
            }
        }

        return res.status(201).json({ success: true, message: "Status uploaded successfully!", data: populateStatus });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

const getStatus = async (req, res) => {
    try {
        const status = await Status.find({
            expireAt: { $gt: new Date() }
        })
            .populate("user", "username profilePicture")
            .populate("viewers.user", "username profilePicture")
            .sort({ createdAt: 1 });


        return res.status(201).json({ success: true, message: "Status fetched successfully!", data: status });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

const statusViews = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);

        if (!status) {
            return res.status(404).json({
                success: false,
                message: "Status not found!"
            });
        }

        // Owner खुद अपना status देख रहा है
        if (status.user.toString() === userId) {
            return res.status(200).json({
                success: true,
                message: "Owner does not count as viewer"
            });
        }

        // Check whether user already viewed
        const existingViewer = status.viewers.find(
            (viewer) => viewer.user.toString() === userId
        );

        // Already viewed
        if (existingViewer) {
            return res.status(200).json({
                success: true,
                message: "Status already viewed",
                data: {
                    statusId,
                    viewedAt: existingViewer.viewedAt
                }
            });
        }

        // New viewer
        const viewedAt = new Date();

        status.viewers.push({
            user: userId,
            viewedAt
        });

        await status.save();

        // Get updated status
        const updatedStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers.user", "username profilePicture");

        // Realtime update to status owner
        if (req.io && req.socketUserMap) {

            const statusOwnerSocketId =
                req.socketUserMap.get(status.user.toString());

            if (statusOwnerSocketId) {

                const viewData = {
                    statusId,
                    viewerId: userId,
                    viewedAt,
                    totalViewers: updatedStatus.viewers.length,
                    viewers: updatedStatus.viewers
                };

                req.io
                    .to(statusOwnerSocketId)
                    .emit("status_viewed", viewData);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Status viewed successfully",
            data: {
                statusId,
                viewedAt
            }
        });

    } catch (error) {
        console.log("Status view error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return res.status(404).json({ success: false, message: "Status not found!" })
        }
        if (status.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete Status!" });
        }
        await status.deleteOne();

        //emit socket event 
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting user axcet the creater
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_deleted", statusId)
                }
            }
        }

        return res.status(200).json({ success: true, message: "Status deleted successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

module.exports = { createStatus, getStatus, statusViews, deleteStatus };