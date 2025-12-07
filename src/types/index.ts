export interface User {
    _id: string;
    userId: string;
    username: string;
    email: string;
    password: string;
    createdAt: number;
    isBanned?: boolean;
    timeoutUntil?: number;
    role?: 'user' | 'staff' | 'admin';
}

export interface AdminCreds {
    username: string;
    password: string;
}

export interface Product {
    _id: string;
    id: string;
    title: string;
    description: string;
    features: string[];
    priceInr: number;
    priceOwo: number;
    category: string;
    imageUrl: string;
    images?: string[];
    downloadUrl?: string;
    type: "workflow" | "pack" | "audio" | "other";
    meta?: {
        nodeCount?: number;
        trigger?: string;
        fileCount?: number;
        fileSize?: string;
        resolution?: string;
        duration?: string;
        format?: string;
        sampleRate?: string;
        bitDepth?: string;
        bitrate?: string;
        integrations?: string;
        jsonPreview?: string;
    };
}

export interface Category {
    _id: string;
    id: string;
    name: string;
    icon: string;
}

export interface UserPermission {
    _id: string;
    userId: string;
    productId: string;
    grantedAt: number;
}

export interface Coupon {
    _id: string;
    id: string;
    code: string;
    percent: number;
}

export interface Review {
    _id: string;
    id: string;
    productId: string;
    userId: string;
    username: string;
    rating: number;
    comment: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
}

export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    type: 'text' | 'system';
    imageUrl?: string;
    role?: 'user' | 'staff' | 'admin';
}

export interface ServerLog {
    _id: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    stack?: string;
    metadata?: any;
}

export interface AppSettings {
    discordLink: string;
    storeName: string;
    heroImage: string;
    maintenanceMode: boolean;
    chatEnabled: boolean;
    communityLink?: string;
    allowedDomains?: string[];
}

export interface Order {
    _id?: string;
    id: string;
    userId: string;
    username: string;
    productId: string;
    productTitle: string;
    amount: number;
    currency: string;
    memo: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: number;
}

export interface ForumReply {
    id: string;
    content: string;
    author: {
        userId?: string;
        username: string;
    };
    createdAt: number;
}

export interface ForumPost {
    _id: string;
    id: string;
    title: string;
    content: string;
    tags: string[];
    author: {
        userId?: string;
        username: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    likes: number;
    likedBy: string[];
    replies: ForumReply[];
    images?: string[];
}
