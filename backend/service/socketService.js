const { Server, Socket } = require("socket.io");
const User = require("../models/user");
const Message = require("../models/message");
const handleVideoCallEvents = require("./videoCallEvents");
const socketMiddleware = require("../middleware/socketMiddleware");

// map to store online user => userId , socketId
const onlineUser = new Map();

//map to track typing status => userId ->[conversation].boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
        },
        pingTimeout: 60000, //disconnect socket after 60 second
    })

    //middleware
    io.use(socketMiddleware);

    //when a new socket cnnection stablished
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);
        let userId = null;

        //handle user connection and mark online in db
        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = connectingUserId;
                socket.userId = userId;
                onlineUser.set(userId, socket.id);
                socket.join(userId) // join a personal room for direct emits

                // update user status in db 
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date(),
                });

                //notify all user that this user is online now 
                io.emit("user_status", { userId, isOnline: true });

            } catch (error) {
                console.error("Error handling user connection", error)
            }
        });

        // return online status of requested user
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUser.has(requestedUserId)
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            })
        });

        //forward message to receiver if online
        socket.on("send_message", async (message) => {
            try {
                const receiverSocketId = onlineUser.get(message.receiver?._id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message)
                }
            } catch (error) {
                console.error("Error on sending message", error);
                socket.emit("message_error", { error: "Failed to send message" })
            }
        })

        //update message as read and notified user
        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } }
                )

                const senderSocketId = onlineUser.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_status_update", {
                            messageId,
                            messageStatus: "read"
                        })
                    })
                }
            } catch (error) {
                console.error("Error on updating message read status", error);
            }
        });


        //hanlde start typing event and auto stop after 3s
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (!typingUsers.has(userId)) typingUsers.set(userId, {});

            const userTyping = typingUsers.get(userId)

            userTyping[conversationId] = true;

            //clear any existing timeout
            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`])
            }

            //auto stop after 3s
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                })
            }, 3000);

            //Notify receiver
            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true
            })

        })

        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`])
                    delete userTyping[`${conversationId}_timeout`]
                }
            }

            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false
            })
        })

        //add or updated reaction on message
        socket.on("add_reaction", async ({ messageId, emoji, userId: reactionUserId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === reactionUserId
                )

                if (existingIndex > -1) {
                    const existing = message.reactions[existingIndex]
                    if (existing.emoji === emoji) {
                        // remove same reaction 
                        message.reactions.splice(existingIndex, 1)
                    } else {
                        //cahnge emoji
                        message.reactions[existingIndex].emoji = emoji;
                    }
                } else {
                    //add new reaction
                    message.reactions.push({ user: reactionUserId, emoji });
                }

                await message.save();

                const populateMessage = await Message.findOne(message?._id)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username")

                const reactionUpdated = {
                    messageId,
                    reactions: populateMessage.reactions
                }

                const senderSocket = onlineUser.get(populateMessage.sender._id.toString());
                const receiverSocket = onlineUser.get(populateMessage.receiver._id.toString());

                if (senderSocket) io.to(senderSocket).emit("reaction_update", reactionUpdated)

                if (receiverSocket) io.to(receiverSocket).emit("reaction_update", reactionUpdated)

            } catch (error) {
                console.log("Error handling reactions", error);
            }
        });

        // handle video call events 
        handleVideoCallEvents(socket, io, onlineUser);

        //handle disconnection user mark offline 
        const handleDisconnect = async () => {
            if (!userId) return;

            try {
                onlineUser.delete(userId);

                //clear all typing timeouts
                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith('_timeout')) clearTimeout(userTyping[key])
                    })

                    typingUsers.delete(userId)
                }
                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                });

                io.emit("user_status", {
                    userId,
                    isOnline: false,
                    lastSeen: new Date(),
                });
                socket.leave(userId);
                console.log(`User ${userId} disconnected`);

            } catch (error) {
                console.error("Error handling disconnection", error);
            }

        }

        // disconnect envent
        socket.on("disconnect", handleDisconnect)
    });

    // attach the online user man to tthe foe external user
    io.socketUserMap = onlineUser;
    return io;

}

module.exports = initializeSocket;