const { uploadFileToClodinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/conversation");
const Message = require("../models/message");


const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;

        const participants = [senderId, receiverId].sort();
        // check if conversation already exists 
        let conversation = await Conversation.findOne({ participants: participants });
        if (!conversation) {
            conversation = new Conversation({ participants })
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = null;

        // handle file upload 
        if (file) {
            const uploadFile = await uploadFileToClodinary(file);

            if (!uploadFile?.secure_url) {
                return res.status(400).json({ success: false, message: " Failed to upload media" });
            }
            imageOrVideoUrl = uploadFile?.secure_url;

            if (file.mimetype.startsWith('image')) {
                contentType = "image"
            } else if (file.mimetype.startsWith('video')) {
                contentType = "video"
            } else {
                return res.status(400).json({ success: false, message: "File type not support" });
            }
        } else if (content?.trim()) {
            contentType = "text"
        } else {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }

        const message = new Message({
            conversation: conversation?._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus
        });
        await message.save();

        if (message?.content) {
            conversation.lastMessage = message?._id
        }
        conversation.unreadCount += 1;
        await conversation.save();

        const populateMessage = await Message.findOne(message?._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")

        // emit socket event for realtime
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting user axcet the creater
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populateMessage);
                message.messageStatus = "delivered";
                await message.save();
            }
        }

        return res.status(201).json({ success: true, message: "Message send successfully!", data:populateMessage });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

// get conversation 
const getConversation = async (req, res) => {
    const userId = req.user.userId;

    try {
        const conversation = await Conversation.find({ participants: userId })
            .populate("participants", "username profilePicture isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture"
                }
            }).sort({ updatedAt: -1 });

        return res.status(201).json({ success: true, message: "Conversation fetched successfully!", data:conversation });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

// get message of specific conversation 
const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found!" });
        }

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: "Not authorized to view this conversation!" });
        }

        const message = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        await Message.updateMany({
            conversation: conversationId,
            receiver: userId,
            messageStatus: { $in: ["send", "delivered"] }
        }, { $set: { messageStatus: "read" } });

        return res.status(200).json({ success: true, message: "Message retrived!", data:message });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

const marksAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.userId;

    try {
        const messages = await Message.find({
            _id: { $in: messageIds },
            receiver: userId
        });

        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        // notify to original sender
        if (req.io && req.socketUserMap) {
            for(const message of messages){
                const senderSocketId = req.socketUserMap.get(message.sender.toString());
                if(senderSocketId){
                    const updateMessage ={
                        _id: message._id,
                        messageStatus: "read"
                    };
                    req.io.to(senderSocketId).emit("message_read", updateMessage);
                    await message.save();
                }
            }
        }

        return res.status(200).json({ success: true, message: "Messages marked as read", messages });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found!" });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this message!" });
        }
        await message.deleteOne();

                //emit socket event 
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
            if(receiverSocketId){
                req.io.to(receiverSocketId).emit("message_deleted", messageId);
            }
        }

        return res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Inernal server error" });
    }
}

module.exports = { sendMessage, getConversation, getMessages, marksAsRead, deleteMessage };