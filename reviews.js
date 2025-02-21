document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('reviewsList');

    // Load existing reviews
    loadReviews();

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const review = document.getElementById('review').value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        // Save the review
        saveReview(name, review);
        
        // Clear the form
        reviewForm.reset();
    });

    function saveReview(name, review) {
        // Get existing reviews from localStorage
        const reviews = JSON.parse(localStorage.getItem('gameReviews') || '[]');
        
        // Add new review
        reviews.push({
            name,
            review,
            date: new Date().toLocaleDateString()
        });
        
        // Save back to localStorage
        localStorage.setItem('gameReviews', JSON.stringify(reviews));
        
        // Reload reviews display
        loadReviews();
    }

    function loadReviews() {
        const reviews = JSON.parse(localStorage.getItem('gameReviews') || '[]');
        
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <h3>${review.name}</h3>
                <small>${review.date}</small>
                <p>${review.review}</p>
            </div>
        `).join('');
    }
}); 