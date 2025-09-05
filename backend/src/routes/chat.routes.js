import { Router } from 'express';
import { Chat } from '../models/chat.model.js';
import passport from 'passport';
import { HfInference } from '@huggingface/inference';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/chat';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// Initialize Hugging Face
const hf = new HfInference(process.env.HF_TOKEN);

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Authentication error', 
                details: err.message 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid or expired token',
                details: info ? info.message : 'No user found'
            });
        }

        req.user = user;
        next();
    })(req, res, next);
};

// GET /api/chats - Get all user's chats
router.get('/', authenticateUser, async (req, res) => {
    try {
        const chats = await Chat.find({ 
            userId: req.user._id,
            isActive: true 
        })
        .select('title createdAt updatedAt messages')
        .sort({ updatedAt: -1 });

        // Transform to include last message preview
        const chatsWithPreview = chats.map(chat => ({
            id: chat._id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            messageCount: chat.messages.length,
            lastMessage: chat.messages.length > 0 
                ? chat.messages[chat.messages.length - 1]
                : null
        }));

        res.json({
            success: true,
            chats: chatsWithPreview
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chats',
            details: error.message
        });
    }
});

// GET /api/chats/:chatId - Get specific chat with all messages
router.get('/:chatId', authenticateUser, async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.chatId,
            userId: req.user._id,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        res.json({
            success: true,
            chat: {
                id: chat._id,
                title: chat.title,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                messages: chat.messages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat',
            details: error.message
        });
    }
});

// POST /api/chats - Create new chat
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { title, initialMessage } = req.body;

        const chat = new Chat({
            userId: req.user._id,
            title: title || 'Medical Consultation',
            messages: []
        });

        // Add initial doctor message
        chat.messages.push({
            text: "Hello! I'm Dr. Sarah, an AI simulating a doctor. Describe your symptoms, and I'll provide general health advice. Remember, this is not real medical advice—consult a professional doctor for any health issues.",
            sender: 'doctor',
            timestamp: new Date(),
            status: 'read'
        });

        // Add user's initial message if provided
        if (initialMessage && initialMessage.trim()) {
            chat.messages.push({
                text: initialMessage.trim(),
                sender: 'user',
                timestamp: new Date(),
                status: 'sent'
            });
        }

        await chat.save();

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            chat: {
                id: chat._id,
                title: chat.title,
                createdAt: chat.createdAt,
                messages: chat.messages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create chat',
            details: error.message
        });
    }
});


// POST /api/chats/:chatId/messages - Send message to specific chat
router.post('/:chatId/messages', authenticateUser, upload.single('attachment'), async (req, res) => {
    try {
        const { text } = req.body;
        const chatId = req.params.chatId;

        // Require either text or attachment
        if ((!text || !text.trim()) && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'Message text or attachment is required'
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            userId: req.user._id,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        // Create user message
        const userMessage = {
            text: text ? text.trim() : '', // Allow empty text if attachment present
            sender: 'user',
            timestamp: new Date(),
            status: 'sent'
        };

        // Handle file attachment
        if (req.file) {
            userMessage.attachment = {
                type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
                url: `/uploads/chat/${req.file.filename}`,
                name: req.file.originalname,
                size: req.file.size
            };
        }

        chat.messages.push(userMessage);
        await chat.save();

        // Generate AI response
        try {
            const aiResponse = await generateDoctorResponse(chat.messages, userMessage.text || 'User sent an attachment');
            
            const doctorMessage = {
                text: aiResponse,
                sender: 'doctor',
                timestamp: new Date(),
                status: 'read'
            };

            chat.messages.push(doctorMessage);
            await chat.save();

            res.json({
                success: true,
                userMessage,
                doctorMessage,
                chat: {
                    id: chat._id,
                    title: chat.title,
                    updatedAt: chat.updatedAt
                }
            });
        } catch (aiError) {
            console.error('AI Response Error:', aiError);
            
            // Send fallback response
            const fallbackMessage = {
                text: "This is general information only—not a substitute for professional medical care. Consult a real doctor. I'm experiencing some technical difficulties right now. Please try again in a moment, and if symptoms are urgent, please seek immediate medical attention.",
                sender: 'doctor',
                timestamp: new Date(),
                status: 'read'
            };

            chat.messages.push(fallbackMessage);
            await chat.save();

            res.json({
                success: true,
                userMessage,
                doctorMessage: fallbackMessage,
                chat: {
                    id: chat._id,
                    title: chat.title,
                    updatedAt: chat.updatedAt
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to send message',
            details: error.message
        });
    }
});

// PUT /api/chats/:chatId - Update chat title
router.put('/:chatId', authenticateUser, async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }

        const chat = await Chat.findOneAndUpdate(
            {
                _id: req.params.chatId,
                userId: req.user._id,
                isActive: true
            },
            { 
                title: title.trim(),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        res.json({
            success: true,
            message: 'Chat updated successfully',
            chat: {
                id: chat._id,
                title: chat.title,
                updatedAt: chat.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update chat',
            details: error.message
        });
    }
});

// DELETE /api/chats/:chatId - Delete (soft delete) chat
router.delete('/:chatId', authenticateUser, async (req, res) => {
    try {
        const chat = await Chat.findOneAndUpdate(
            {
                _id: req.params.chatId,
                userId: req.user._id,
                isActive: true
            },
            { 
                isActive: false,
                updatedAt: new Date()
            }
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete chat',
            details: error.message
        });
    }
});

// Helper function to generate AI doctor response
async function generateDoctorResponse(messages, userMessage) {
    try {
        // Prepare conversation context
        const conversationHistory = messages
            .filter(msg => msg.sender === 'user' || msg.sender === 'doctor')
            .slice(-10) // Keep last 10 messages for context
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

        const apiMessages = [
            {
                role: "system",
                content: "You are Dr. Sarah, a knowledgeable AI doctor. Based on user descriptions, provide possible diagnoses, medication suggestions, prescriptons and health advice. Always start responses with: 'This is general information only—not a substitute for professional medical care. Consult a real doctor.' Be empathetic, accurate, and suggest seeking immediate help for serious issues. Keep responses concise but informative."
            },
            ...conversationHistory,
            {
                role: "user",
                content: userMessage
            }
        ];

        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: apiMessages,
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        console.error('Hugging Face API Error:', error);
        
        // Fallback responses
        const fallbacks = [
            "This is general information only—not a substitute for professional medical care.",
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

export default router;
