import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'doctor']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'read'],
        default: 'sent'
    },
    attachment: {
        type: {
            type: String,
            enum: ['image', 'file']
        },
        url: String,
        name: String,
        size: Number
    }
}, { _id: true });

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Medical Consultation'
    },
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
chatSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);