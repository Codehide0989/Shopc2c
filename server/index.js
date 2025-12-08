import express from 'express';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { User, Product, Category, Review, ChatMessage, AppSettings, Permission, Coupon, ServerLog, ForumPost, C2CIde } from './models/index.js';

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: true
    },
    transports: ['polling', 'websocket'] // Force polling support
});

// Store connected users: socketId -> User Info
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_chat', (userInfo) => {
        socket.join('global_chat');

        // Store user info if provided, otherwise anonymous/default
        const user = userInfo || { userId: 'guest_' + socket.id.substr(0, 4), username: 'Guest', role: 'user' };
        // Ensure role is present
        if (!user.role) user.role = 'user';

        connectedUsers.set(socket.id, user);

        console.log(`User ${user.username} (${socket.id}) joined global_chat as ${user.role}`);

        // Broadcast updated user list
        io.to('global_chat').emit('user_list_update', Array.from(connectedUsers.values()));
    });

    socket.on('send_message', async (message) => {
        try {
            // Save to DB
            const newMessage = new ChatMessage({
                id: message.id,
                userId: message.userId,
                username: message.username,
                content: message.content,
                imageUrl: message.imageUrl,
                role: message.role || 'user', // Ensure role is captured if sent, default to user
                timestamp: message.timestamp,
                type: 'text'
            });
            await newMessage.save();

            // Broadcast to room
            io.to('global_chat').emit('receive_message', newMessage);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (connectedUsers.has(socket.id)) {
            connectedUsers.delete(socket.id);
            // Broadcast updated user list
            io.to('global_chat').emit('user_list_update', Array.from(connectedUsers.values()));
        }
    });
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

// MongoDB Connection Optimization for Serverless
let cachedConnection = null;

const connectToDatabase = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (mongoose.connection.readyState === 1) {
        cachedConnection = mongoose.connection;
        console.log('Using existing MongoDB connection');
        return cachedConnection;
    }

    if (MONGODB_URI && typeof MONGODB_URI === 'string') {
        console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

        try {
            cachedConnection = await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Connected to MongoDB');
            return cachedConnection;
        } catch (err) {
            console.error('MongoDB connection error:', err);
            throw err;
        }
    } else {
        console.error('MONGODB_URI is missing in environment variables');
    }
};

// Connect immediately on startup (for local dev) but also export/use in routes if needed
connectToDatabase();

app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

// Root Route
app.get('/', (req, res) => {
    res.send('ShopC2C Server is Running');
});

app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' :
        mongoose.connection.readyState === 2 ? 'connecting' :
            mongoose.connection.readyState === 3 ? 'disconnecting' : 'disconnected';

    res.json({
        status: 'online',
        message: 'Server is healthy',
        timestamp: Date.now(),
        env: process.env.NODE_ENV,
        database: dbStatus
    });
});

app.get('/api/admin/server-logs', async (req, res) => {
    try {
        const logs = await ServerLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Routes ---

// Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const productData = req.body;
        // Check if update or create
        if (productData._id) {
            const updated = await Product.findByIdAndUpdate(productData._id, productData, { new: true });
            return res.json(updated);
        }
        // Check by id field
        const existing = await Product.findOne({ id: productData.id });
        if (existing) {
            const updated = await Product.findOneAndUpdate({ id: productData.id }, productData, { new: true });
            return res.json(updated);
        }
        const newProduct = new Product(productData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const catData = req.body;
        if (catData._id) {
            const updated = await Category.findByIdAndUpdate(catData._id, catData, { new: true });
            return res.json(updated);
        }
        const existing = await Category.findOne({ id: catData.id });
        if (existing) {
            const updated = await Category.findOneAndUpdate({ id: catData.id }, catData, { new: true });
            return res.json(updated);
        }
        const newCat = new Category(catData);
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await Category.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth
app.post('/api/auth/register', async (req, res) => {
    try {
        let { userId, username, email, password } = req.body;

        // Domain Restriction Check
        try {
            const settings = await AppSettings.findOne();
            if (settings && settings.allowedDomains && settings.allowedDomains.length > 0) {
                const emailDomain = email.split('@')[1];
                if (!emailDomain || !settings.allowedDomains.includes(emailDomain)) {
                    console.log(`[Auth] Registration blocked for domain: ${emailDomain}`);
                    return res.status(403).json({ error: `Email domain not allowed. Allowed domains: ${settings.allowedDomains.join(', ')}` });
                }
            }
        } catch (settingsErr) {
            console.error("[Auth] Error checking settings during register:", settingsErr);
            // Continue registration if settings check fails to avoid blocking users due to system error
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        if (!userId) {
            userId = `user_${randomUUID()}`;
        }
        const newUser = new User({ userId, username, email, password }); // Plain text for now
        await newUser.save();

        // Auto-grant free products
        const freeProducts = await Product.find({ priceInr: 0 });
        if (freeProducts.length > 0) {
            const permissions = freeProducts.map(p => ({
                userId: newUser.userId,
                productId: p.id,
                grantedAt: Date.now()
            }));
            await Permission.insertMany(permissions);
        }

        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Check for default admin credentials if not in DB
        // Ideally this should be seeded, but for quick fix:
        if (identifier === 'admin' && password === 'admin123') { // Using default from constants
            // Check if admin exists in DB, if not return a mock one or create one?
            // Let's try to find it first.
            let adminUser = await User.findOne({ userId: 'admin' });
            if (!adminUser) {
                // Create default admin if not exists
                adminUser = new User({
                    userId: 'admin',
                    username: 'Admin',
                    email: 'admin@shopc2c.io',
                    password: 'admin123', // In real app, hash this!
                    isAdmin: true // Assuming we might add this flag later, but userId='admin' is the check
                });
                await adminUser.save();
            }
            return res.json(adminUser);
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { userId: identifier }],
            password: password
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const existing = await Review.findOne({ productId, userId });
        if (existing) {
            return res.status(400).json({ error: "You have already reviewed this product." });
        }
        const review = new Review(req.body);
        await review.save();
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/reviews/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const review = await Review.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true }
        );
        res.json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        console.log(`[API] Fetched ${coupons.length} coupons`);
        res.json(coupons);
    } catch (err) {
        console.error("[API] Error fetching coupons:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const { code, percent } = req.body;
        const newCoupon = new Coupon({
            id: `coupon_${randomUUID()}`,
            code,
            percent
        });
        await newCoupon.save();
        res.status(201).json(newCoupon);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/coupons/:id', async (req, res) => {
    try {
        await Coupon.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat History
app.get('/api/chat/history', async (req, res) => {
    try {
        const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(50);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/chat/message/:id', async (req, res) => {
    try {
        await ChatMessage.findOneAndDelete({ id: req.params.id });
        io.to('global_chat').emit('message_deleted', req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Settings
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = new AppSettings({
                discordLink: "https://discord.gg/shopc2c",
                storeName: "Shopc2c",
                heroImage: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200",
                maintenanceMode: false,
                chatEnabled: true,
                allowedDomains: []
            });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = await AppSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings/chat', async (req, res) => {
    try {
        const { enabled } = req.body;
        const settings = await AppSettings.findOneAndUpdate({}, { chatEnabled: enabled }, { new: true, upsert: true });
        io.emit('chat_status_change', enabled);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Permissions (My Assets)
// Permissions (My Assets)
app.get('/api/permissions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = await Permission.find({ userId });
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/permissions', async (req, res) => {
    try {
        const permissions = await Permission.find();
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/permissions', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        // Check if already exists
        const existing = await Permission.findOne({ userId, productId });
        if (existing) return res.json(existing);

        const newPerm = new Permission({
            userId,
            productId,
            grantedAt: Date.now()
        });
        await newPerm.save();
        res.status(201).json(newPerm);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/permissions/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        await Permission.findOneAndDelete({ userId, productId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/permissions/sync-free', async (req, res) => {
    try {
        const { userId } = req.body;
        const freeProducts = await Product.find({ priceInr: 0 });
        const existingPermissions = await Permission.find({ userId });

        const newPermissions = [];
        for (const prod of freeProducts) {
            if (!existingPermissions.some(p => p.productId === prod.id)) {
                newPermissions.push({
                    userId,
                    productId: prod.id,
                    grantedAt: Date.now()
                });
            }
        }

        if (newPermissions.length > 0) {
            await Permission.insertMany(newPermissions);
        }

        const allPermissions = await Permission.find({ userId });
        res.json(allPermissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ban User
app.post('/api/admin/ban', async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findOneAndUpdate({ userId }, { isBanned: true });
        // Emit event if needed, or let client poll/refresh
        io.to('global_chat').emit('user_status_change', { userId, status: 'banned' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unban User
app.post('/api/admin/unban', async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findOneAndUpdate({ userId }, { isBanned: false });
        io.to('global_chat').emit('user_status_change', { userId, status: 'active' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Timeout User
app.post('/api/admin/timeout', async (req, res) => {
    try {
        const { userId, minutes } = req.body;
        const timeoutUntil = Date.now() + (minutes * 60 * 1000);
        await User.findOneAndUpdate({ userId }, { timeoutUntil });
        io.to('global_chat').emit('user_status_change', { userId, status: 'timeout', timeoutUntil });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear Chat
app.post('/api/admin/clear-chat', async (req, res) => {
    try {
        await ChatMessage.deleteMany({});
        io.to('global_chat').emit('chat_cleared');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single User (for session refresh)
app.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set User Role
app.post('/api/admin/set-role', async (req, res) => {
    try {
        const { identifier, role } = req.body;
        console.log(`[SetRole] Request for identifier: ${identifier}, role: ${role}`);

        if (!['user', 'staff', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { $or: [{ userId: identifier }, { username: identifier }, { email: identifier }] },
            { role },
            { new: true }
        );

        console.log(`[SetRole] Updated user:`, updatedUser);

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error(`[SetRole] Error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Forum
app.get('/api/forum', async (req, res) => {
    try {
        const posts = await ForumPost.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/forum/:id', async (req, res) => {
    try {
        const post = await ForumPost.findOne({ id: req.params.id });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forum', async (req, res) => {
    try {
        const { title, content, tags, author, images } = req.body;

        if (!tags || tags.length === 0) {
            return res.status(400).json({ error: "Tags are required" });
        }

        let postAuthor = author;

        // Guest Handling - REJECTED
        if (!author || !author.userId) {
            return res.status(401).json({ error: "You must be logged in to create a post." });
        }

        // Verify user exists in DB to prevent spoofing
        const userExists = await User.findOne({ userId: author.userId });
        if (userExists) {
            postAuthor = {
                userId: userExists.userId,
                username: userExists.username,
                role: userExists.role
            };
        } else {
            return res.status(401).json({ error: "Invalid user account." });
        }

        // Check for pending posts by this user (even guest)
        if (postAuthor.role !== 'admin' && postAuthor.role !== 'staff') {
            const existingPending = await ForumPost.findOne({
                'author.userId': postAuthor.userId,
                status: 'pending'
            });

            if (existingPending) {
                return res.status(400).json({ error: "You already have a pending post. Please wait for approval." });
            }
        }

        const isAdminOrStaff = postAuthor.role === 'admin' || postAuthor.role === 'staff';

        const newPost = new ForumPost({
            id: `post_${randomUUID()}`,
            title,
            content,
            tags,
            author: postAuthor,
            status: isAdminOrStaff ? 'approved' : 'pending',
            replies: [],
            images: images || []
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forum/:id/reply', async (req, res) => {
    try {
        const { content, author } = req.body;

        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        let replyAuthor = author;

        // Guest Handling
        if (!author || !author.userId) {
            replyAuthor = {
                userId: `guest_${randomUUID().substr(0, 8)}`,
                username: "Guest",
                role: "guest"
            };
        } else {
            // Verify user exists
            const userExists = await User.findOne({ userId: author.userId });
            if (userExists) {
                replyAuthor = {
                    userId: userExists.userId,
                    username: userExists.username,
                    role: userExists.role
                };
            } else {
                return res.status(401).json({ error: "Invalid user account." });
            }
        }

        const reply = {
            id: `reply_${randomUUID()}`,
            content,
            author: replyAuthor,
            createdAt: Date.now()
        };

        const post = await ForumPost.findOneAndUpdate(
            { id: req.params.id },
            { $push: { replies: reply } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C2C IDE
app.get('/api/c2cide', async (req, res) => {
    try {
        const ides = await C2CIde.find().sort({ createdAt: -1 });
        res.json(ides);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/c2cide', async (req, res) => {
    try {
        const { title, url, imageUrl, timerDuration } = req.body;
        const newIde = new C2CIde({
            id: `ide_${randomUUID()}`,
            title,
            url,
            // If imageUrl is empty/null, model default will take over if we don't pass it, 
            // but here we are passing it. Let's ensure undefined if empty string.
            imageUrl: imageUrl || undefined,
            timerDuration
        });
        await newIde.save();
        res.status(201).json(newIde);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/api/c2cide/:id', async (req, res) => {
    try {
        const { title, url, imageUrl, timerDuration } = req.body;
        const updatedIde = await C2CIde.findOneAndUpdate(
            { id: req.params.id },
            { title, url, imageUrl, timerDuration },
            { new: true }
        );
        if (!updatedIde) return res.status(404).json({ error: "IDE not found" });
        res.json(updatedIde);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/c2cide/:id', async (req, res) => {
    try {
        await C2CIde.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Forum Routes
app.get('/api/admin/forum/pending', async (req, res) => {
    try {
        const posts = await ForumPost.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/forum/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const post = await ForumPost.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forum/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID required" });

        const post = await ForumPost.findOne({ id: req.params.id });
        if (!post) return res.status(404).json({ error: "Post not found" });

        const hasLiked = post.likedBy.includes(userId);
        let update;

        if (hasLiked) {
            update = {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            };
        } else {
            update = {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            };
        }

        const updatedPost = await ForumPost.findOneAndUpdate(
            { id: req.params.id },
            update,
            { new: true }
        );

        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Admin - Get All Posts (for management)
app.get('/api/admin/forum/all', async (req, res) => {
    try {
        const posts = await ForumPost.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin - Delete Post
app.delete('/api/forum/:id', async (req, res) => {
    try {
        await ForumPost.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to log errors
const logError = async (err, context = {}) => {
    try {
        console.error(`[ServerError] ${err.message}`, err);
        const log = new ServerLog({
            level: 'error',
            message: err.message,
            stack: err.stack,
            metadata: context
        });
        await log.save();
    } catch (loggingErr) {
        console.error("Failed to save error log:", loggingErr);
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    logError(err, { path: req.path, method: req.method });
    res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
