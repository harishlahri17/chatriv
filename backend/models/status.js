const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: ['image', 'video', 'audio', 'text'],
        default: 'text'
    },
    viewers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: true
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    expireAt: {
        type: Date,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("status", statusSchema);