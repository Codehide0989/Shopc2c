
// Native fetch is available in Node.js 18+

async function checkReviews() {
    try {
        console.log("Fetching reviews from http://localhost:5000/api/reviews...");
        const res = await fetch('http://localhost:5000/api/reviews');
        if (res.ok) {
            const reviews = await res.json();
            console.log("Status:", res.status);
            console.log("Reviews count:", reviews.length);
            console.log("Reviews data:", JSON.stringify(reviews, null, 2));
        } else {
            console.error("Failed to fetch reviews:", res.status, res.statusText);
        }
    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }
}

checkReviews();
