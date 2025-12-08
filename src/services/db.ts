import { User, Product, Category, UserPermission, Coupon, Review, AppSettings, AdminCreds, ChatMessage, Order, ServerLog, ForumPost } from "../types";
import { generateId } from "../utils/helpers";
import { DEFAULT_DISCORD_LINK, DEFAULT_HERO_IMAGE, DEFAULT_ADMIN_USER, DEFAULT_ADMIN_PASS, ENV } from "../utils/constants";
import { io, Socket } from "socket.io-client";

class DatabaseAdapter {
    private socket: Socket | null = null;
    private apiUrl = ENV.API_URL;
    private socketUrl = this.apiUrl.replace('/api', '');

    constructor() {
        console.log(`[System] Initializing Data Layer... API: ${this.apiUrl} | Socket: ${this.socketUrl}`);
        this.socket = io(this.socketUrl || "http://localhost:5000", {
            transports: ['polling', 'websocket'], // matching server config
            reconnectionAttempts: 5,
            autoConnect: true
        });
        this.socket.on('connect', () => console.log('[System] Socket connected to ' + this.socketUrl));
        this.socket.on('connect_error', (err) => console.error('[System] Socket connection error:', err));
    }

    // --- Products ---
    async getProducts(): Promise<Product[]> {
        try {
            const res = await fetch(`${this.apiUrl}/products`);
            if (!res.ok) throw new Error("Failed to fetch products");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async saveProduct(product: Product) {
        const res = await fetch(`${this.apiUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!res.ok) throw new Error("Failed to save product");
    }

    async deleteProduct(id: string) {
        await fetch(`${this.apiUrl}/products/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Categories ---
    async getCategories(): Promise<Category[]> {
        try {
            const res = await fetch(`${this.apiUrl}/categories`);
            if (!res.ok) throw new Error("Failed to fetch categories");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async saveCategory(category: Category) {
        await fetch(`${this.apiUrl}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
    }

    async deleteCategory(id: string) {
        await fetch(`${this.apiUrl}/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Users (Auth) ---
    async loginUser(identifier: string, password: string): Promise<User | null> {
        try {
            const res = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async createUser(user: Omit<User, '_id' | 'createdAt'>): Promise<User> {
        try {
            const res = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Registration failed");
            }
            return await res.json();
        } catch (e: any) {
            throw e;
        }
    }

    async getUserById(userId: string): Promise<User | undefined> {
        try {
            const users = await this.getUsers();
            return users.find(u => u.userId === userId);
        } catch (e) {
            return undefined;
        }
    }

    async getAllReviews(): Promise<Review[]> {
        try {
            const res = await fetch(`${this.apiUrl}/reviews`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async getPublicReviews(productId: string): Promise<Review[]> {
        const reviews = await this.getAllReviews();
        return reviews.filter(r => r.productId === productId && r.status === 'approved');
    }

    async hasUserReviewed(userId: string, productId: string): Promise<boolean> {
        const reviews = await this.getAllReviews();
        return reviews.some(r => r.userId === userId && r.productId === productId);
    }

    async addReview(review: Omit<Review, "id" | "timestamp" | "_id" | "status">) {
        await fetch(`${this.apiUrl}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });
    }

    async updateReviewStatus(id: string, status: string) {
        await fetch(`${this.apiUrl}/reviews/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    }

    // --- Settings ---
    async getSettings(): Promise<AppSettings> {
        try {
            const res = await fetch(`${this.apiUrl}/settings`);
            return await res.json();
        } catch (e) {
            return {
                discordLink: DEFAULT_DISCORD_LINK,
                storeName: "Shopc2c",
                heroImage: DEFAULT_HERO_IMAGE,
                maintenanceMode: false,
                chatEnabled: true,
                communityLink: "",
                forumCreationEnabled: true,
                allowedDomains: []
            };
        }
    }

    async saveSettings(settings: AppSettings) {
        await fetch(`${this.apiUrl}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    }

    async toggleChat(enabled: boolean) {
        await fetch(`${this.apiUrl}/settings/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
    }

    // --- Chat ---
    async getMessages(): Promise<ChatMessage[]> {
        try {
            const res = await fetch(`${this.apiUrl}/chat/history`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    joinChat(user?: { userId: string, username: string, role?: string }) {
        this.socket?.emit('join_chat', user);
    }

    sendMessage(userId: string, username: string, content: string, role: string = 'user', imageUrl?: string) {
        const message = {
            id: `msg_${generateId()}`,
            userId,
            username,
            content,
            imageUrl,
            role,
            timestamp: Date.now(),
            type: 'text'
        };
        this.socket?.emit('send_message', message);
    }

    onMessage(callback: (msg: ChatMessage) => void) {
        this.socket?.on('receive_message', callback);
    }

    offMessage(callback?: (msg: ChatMessage) => void) {
        if (callback) {
            this.socket?.off('receive_message', callback);
        } else {
            this.socket?.off('receive_message');
        }
    }

    onChatStatusChange(callback: (enabled: boolean) => void) {
        this.socket?.on('chat_status_change', callback);
    }

    offChatStatusChange(callback?: (enabled: boolean) => void) {
        if (callback) {
            this.socket?.off('chat_status_change', callback);
        } else {
            this.socket?.off('chat_status_change');
        }
    }

    onConnectionChange(callback: (isConnected: boolean) => void) {
        const onConnect = () => callback(true);
        const onDisconnect = () => callback(false);
        this.socket?.on('connect', onConnect);
        this.socket?.on('disconnect', onDisconnect);
        return { onConnect, onDisconnect };
    }

    offConnectionChange(handlers: { onConnect: () => void, onDisconnect: () => void }) {
        if (!handlers) return;
        this.socket?.off('connect', handlers.onConnect);
        this.socket?.off('disconnect', handlers.onDisconnect);
    }

    onUserListUpdate(callback: (users: any[]) => void) {
        this.socket?.on('user_list_update', callback);
    }

    offUserListUpdate(callback?: (users: any[]) => void) {
        if (callback) {
            this.socket?.off('user_list_update', callback);
        } else {
            this.socket?.off('user_list_update');
        }
    }

    async deleteMessage(id: string) {
        await fetch(`${this.apiUrl}/chat/message/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Admin Actions ---
    async banUser(userId: string) {
        await fetch(`${this.apiUrl}/admin/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
    }

    async unbanUser(userId: string) {
        await fetch(`${this.apiUrl}/admin/unban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
    }

    async timeoutUser(userId: string, minutes: number) {
        await fetch(`${this.apiUrl}/admin/timeout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, minutes })
        });
    }

    async clearChat() {
        await fetch(`${this.apiUrl}/admin/clear-chat`, {
            method: 'POST'
        });
    }

    async getUsers(): Promise<User[]> {
        try {
            const res = await fetch(`${this.apiUrl}/users`);
            if (!res.ok) {
                console.error(`[DB] Failed to fetch users: ${res.status} ${res.statusText}`);
                return [];
            }
            const users = await res.json();
            console.log(`[DB] Fetched ${users.length} users`);
            return users;
        } catch (e) {
            console.error("[DB] Error fetching users:", e);
            return [];
        }
    }

    async setUserRole(identifier: string, role: 'user' | 'staff' | 'admin') {
        const res = await fetch(`${this.apiUrl}/admin/set-role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to set role");
        }
        return await res.json();
    }

    async getLatestUser(userId: string): Promise<User | null> {
        try {
            const res = await fetch(`${this.apiUrl}/users/${userId}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // Helper to keep sync compatibility where possible (e.g. settings) - but settings is now async
    // We will need to update call sites.

    async getPermissions(userId: string): Promise<UserPermission[]> {
        try {
            const res = await fetch(`${this.apiUrl}/permissions/${userId}`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async getAllPermissions(): Promise<UserPermission[]> {
        try {
            const res = await fetch(`${this.apiUrl}/permissions`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }
    async grantPermission(userId: string, productId: string) {
        await fetch(`${this.apiUrl}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId })
        });
    }

    async revokePermission(userId: string, productId: string) {
        await fetch(`${this.apiUrl}/permissions/${userId}/${productId}`, {
            method: 'DELETE'
        });
    }

    async syncFreePermissions(userId: string): Promise<UserPermission[]> {
        const res = await fetch(`${this.apiUrl}/permissions/sync-free`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error("Failed to sync free permissions");
        return await res.json();
    }

    async hasPermission(userId: string, productId: string): Promise<boolean> {
        const perms = await this.getPermissions(userId);
        return perms.some(p => p.productId === productId);
    }
    async getCoupons(): Promise<Coupon[]> {
        try {
            const res = await fetch(`${this.apiUrl}/coupons`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async addCoupon(code: string, percent: number) {
        await fetch(`${this.apiUrl}/coupons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, percent })
        });
    }

    async deleteCoupon(id: string) {
        await fetch(`${this.apiUrl}/coupons/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Orders ---
    async getOrders(): Promise<Order[]> {
        try {
            const res = await fetch(`${this.apiUrl}/orders`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async createOrder(order: Order) {
        await fetch(`${this.apiUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
    }

    async updateOrderStatus(id: string, status: string) {
        await fetch(`${this.apiUrl}/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    }
    async getServerLogs(): Promise<ServerLog[]> {
        try {
            const res = await fetch(`${this.apiUrl}/admin/server-logs`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async checkServerHealth(): Promise<{ status: string, message: string, timestamp: number, env: string }> {
        try {
            const res = await fetch(`${this.apiUrl}/health`);
            if (!res.ok) throw new Error("Server check failed");
            return await res.json();
        } catch (e) {
            throw e;
        }
    }

    getAdminCreds(): AdminCreds { return { username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS }; }
    setAdminCreds(creds: AdminCreds) { }

    // --- Forum ---
    async getForumPosts(): Promise<ForumPost[]> {
        try {
            const res = await fetch(`${this.apiUrl}/forum`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async createForumPost(post: Omit<ForumPost, "_id" | "id" | "status" | "createdAt" | "likes" | "likedBy" | "replies">) {
        const res = await fetch(`${this.apiUrl}/forum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create post");
        }
        return await res.json();
    }

    async getForumPost(id: string): Promise<ForumPost | null> {
        try {
            const res = await fetch(`${this.apiUrl}/forum/${id}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    async addForumReply(postId: string, reply: { content: string, author: { username: string, userId?: string } }) {
        const res = await fetch(`${this.apiUrl}/forum/${postId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to add reply");
        }
        return await res.json();
    }

    // Admin Forum
    async getPendingForumPosts(): Promise<ForumPost[]> {
        try {
            const res = await fetch(`${this.apiUrl}/admin/forum/pending`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async getAllForumPostsAdmin(): Promise<ForumPost[]> {
        try {
            const res = await fetch(`${this.apiUrl}/admin/forum/all`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    async deleteForumPost(id: string) {
        await fetch(`${this.apiUrl}/forum/${id}`, {
            method: 'DELETE'
        });
    }

    async updateForumPostStatus(id: string, status: 'approved' | 'rejected') {
        const res = await fetch(`${this.apiUrl}/admin/forum/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to update status");
        }
        return await res.json();
    }
    async toggleLikeForumPost(id: string, userId: string) {
        const res = await fetch(`${this.apiUrl}/forum/${id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to toggle like");
        }
        return await res.json();
    }
}

export const db = new DatabaseAdapter();
