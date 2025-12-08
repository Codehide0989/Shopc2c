
// Native fetch is available in Node.js 18+

async function createTestReview() {
    try {
        // 1. Get a product
        const prodsRes = await fetch('http://localhost:5000/api/products');
        const products = await prodsRes.json();

        if (products.length === 0) {
            console.error("No products found to review.");
            // Create a dummy product if needed, but let's assume there's at least one
            return;
        }

        const product = products[0];
        console.log(`Reviewing product: ${product.title} (${product.id})`);

        // 2. Submit review
        const reviewData = {
            id: `rev_test_${Date.now()}`,
            productId: product.id,
            userId: "test_user_1",
            username: "Test User",
            rating: 5,
            comment: "This is a test review directly from script.",
            status: "pending",
            timestamp: Date.now()
        };

        const res = await fetch('http://localhost:5000/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });

        if (res.ok) {
            const saved = await res.json();
            console.log("Review created successfully:", saved);
        } else {
            console.error("Failed to create review:", await res.text());
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

createTestReview();
