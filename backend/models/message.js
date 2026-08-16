const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    content: {
        type: String,
    },
    imageOrVideoUrl: {
        type: String
    },
    contentType :{
        type: String,
        enum: ['image', 'video', 'audio', 'text']
    },
    reactions: [
        {
            user:{type: mongoose.Schema.Types.ObjectId , ref: 'user'},
            emoji: String
        }
    ],
    messageStatus:{
        type: String,
        default: 'send'
    }

}, {timestamps: true});

module.exports = mongoose.model("message", messageSchema);