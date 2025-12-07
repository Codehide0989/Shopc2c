import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product, Category } from './models/index.js';

dotenv.config();

const INITIAL_CATEGORIES = [
    { id: "cat_1", name: "n8n Workflows", icon: "fa-project-diagram" },
    { id: "cat_2", name: "Meme Packs", icon: "fa-face-laugh-squint" },
    { id: "cat_3", name: "Sound FX", icon: "fa-wave-square" },
    { id: "cat_4", name: "Discord Bots", icon: "fa-robot" },
];

const INITIAL_PRODUCTS = [
    {
        id: "prod_1",
        title: "AI Auto-Blogger v2",
        description: "The ultimate n8n workflow to automate your content strategy. Generates SEO-optimized articles from RSS feeds using GPT-4.",
        features: ["RSS Feed Integration", "GPT-4 Summarization", "SEO Metadata", "Auto-Publishing"],
        priceInr: 0,
        priceOwo: 0,
        category: "n8n Workflows",
        imageUrl: "https://images.unsplash.com/photo-1667372393119-c81c0cda0a29?auto=format&fit=crop&q=80&w=800",
        downloadUrl: "https://github.com/n8n-io/n8n",
        type: "workflow",
        meta: { nodeCount: 14, trigger: "Cron", integrations: "OpenAI, WordPress, Google Sheets" }
    },
    {
        id: "prod_2",
        title: "Dank Memes Mega Pack",
        description: "500+ High resolution templates without watermarks. Perfect for content creators and social media managers.",
        features: ["500+ Templates", "Transparent PNGs", "Viral Formats"],
        priceInr: 499,
        priceOwo: 50000,
        category: "Meme Packs",
        imageUrl: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800",
        type: "pack",
        meta: { fileCount: 500, resolution: "4K", fileSize: "1.2 GB" }
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data (optional, but good for idempotency)
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing products and categories.');

        // Insert Categories
        await Category.insertMany(INITIAL_CATEGORIES);
        console.log(`Seeded ${INITIAL_CATEGORIES.length} categories.`);

        // Insert Products
        await Product.insertMany(INITIAL_PRODUCTS);
        console.log(`Seeded ${INITIAL_PRODUCTS.length} products.`);

        // Seed Admin User
        const adminExists = await import('./models/index.js').then(m => m.User.findOne({ userId: 'admin' }));
        if (!adminExists) {
            const { User } = await import('./models/index.js');
            await User.create({
                userId: 'admin',
                username: 'Admin',
                email: 'admin@shopc2c.io',
                password: 'admin123',
                isAdmin: true
            });
            console.log('Seeded Admin user.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Seeding error:', err);
        process.exit(1);
    });
