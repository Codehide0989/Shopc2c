import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Number, default: Date.now },
    isBanned: { type: Boolean, default: false },
    timeoutUntil: { type: Number },
    role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' }
});

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    features: [String],
    priceInr: { type: Number, required: true },
    priceOwo: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    images: { type: [String], default: [] },
    downloadUrl: String,
    type: { type: String, enum: ['workflow', 'pack', 'audio', 'other'], required: true },
    meta: {
        nodeCount: Number,
        trigger: String,
        fileCount: Number,
        fileSize: String,
        resolution: String,
        duration: String,
        format: String,
        sampleRate: String,
        bitDepth: String,
        bitrate: String,
        integrations: String,
        jsonPreview: String
    }
});

const categorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, required: true }
});

const reviewSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

const chatMessageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
    imageUrl: String,
    role: { type: String, default: 'user' }
});

const couponSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    percent: { type: Number, required: true }
});

const permissionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    grantedAt: { type: Number, default: Date.now }
});

const appSettingsSchema = new mongoose.Schema({
    discordLink: String,
    storeName: String,
    heroImage: String,
    maintenanceMode: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    communityLink: { type: String, default: "" },
    forumCreationEnabled: { type: Boolean, default: true },
    allowedDomains: [String]
});

const serverLogSchema = new mongoose.Schema({
    timestamp: { type: Number, default: Date.now },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'error' },
    message: { type: String, required: true },
    stack: String,
    metadata: Object
});

const forumPostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], required: true },
    author: {
        userId: { type: String, required: true },
        username: { type: String, required: true }
    },
    replies: [{
        id: { type: String, required: true },
        content: { type: String, required: true },
        author: {
            userId: { type: String }, // Optional for guests
            username: { type: String, required: true }
        },
        createdAt: { type: Number, default: Date.now }
    }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Number, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    images: { type: [String], default: [] }
});

export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const Category = mongoose.model('Category', categorySchema);
export const Review = mongoose.model('Review', reviewSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const Coupon = mongoose.model('Coupon', couponSchema);
export const Permission = mongoose.model('Permission', permissionSchema);
export const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
export const ServerLog = mongoose.model('ServerLog', serverLogSchema);
export const ForumPost = mongoose.model('ForumPost', forumPostSchema);
