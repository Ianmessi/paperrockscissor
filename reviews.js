document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('reviewsList');

    // Load existing reviews when page loads
    loadReviews();

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const review = document.getElementById('review').value.trim();

        if (!name || !review) {
            alert('Please fill in both name and review');
            return;
        }

        // Generate a unique ID for the reviewer
        const reviewerId = generateReviewerId(name);
        
        // Save the review with reviewer ID
        saveReview(name, review, reviewerId);
        
        // Store the current user's ID in localStorage
        localStorage.setItem('currentReviewer', reviewerId);
        
        // Clear form
        reviewForm.reset();
    });

    function generateReviewerId(name) {
        return `${name}-${Date.now()}`;
    }

    function saveReview(name, review, reviewerId) {
        // Get existing reviews
        let reviews = JSON.parse(localStorage.getItem('gameReviews') || '[]');
        
        // Create new review object
        const newReview = {
            id: Date.now().toString(),
            reviewerId: reviewerId,
            name: name,
            review: review,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };
        
        // Add to beginning of array
        reviews.unshift(newReview);
        
        // Save to localStorage
        localStorage.setItem('gameReviews', JSON.stringify(reviews));
        
        // Refresh display
        loadReviews();
    }

    function loadReviews() {
        const reviews = JSON.parse(localStorage.getItem('gameReviews') || '[]');
        const currentReviewer = localStorage.getItem('currentReviewer');
        
        reviewsList.innerHTML = '';
        
        reviews.forEach(review => {
            const canDelete = review.reviewerId === currentReviewer;
            
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-item';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-avatar">
                        ${review.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="review-info">
                        <h3 class="reviewer-name">${review.name}</h3>
                        <div class="review-date">${review.date} at ${review.time}</div>
                    </div>
                </div>
                
                <div class="review-content">${review.review}</div>
                
                ${canDelete ? `
                    <div class="review-actions">
                        <button class="review-button delete-review" onclick="deleteReview('${review.id}', '${review.reviewerId}')">
                            Delete
                        </button>
                    </div>
                ` : ''}
            `;
            
            reviewsList.appendChild(reviewElement);
        });

        // Show reviews list after loading new reviews
        document.getElementById('reviewsList').classList.add('show');
        const showReviewsBtn = document.querySelector('.show-reviews-btn');
        showReviewsBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Reviews';
    }

    // Make delete function available globally
    window.deleteReview = function(reviewId, reviewerId) {
        const currentReviewer = localStorage.getItem('currentReviewer');
        
        // Check if the current user has permission to delete
        if (currentReviewer !== reviewerId) {
            alert('You can only delete your own reviews');
            return;
        }

        // Get existing reviews
        let reviews = JSON.parse(localStorage.getItem('gameReviews') || '[]');
        
        // Filter out the review to delete
        reviews = reviews.filter(review => review.id !== reviewId);
        
        // Save back to localStorage
        localStorage.setItem('gameReviews', JSON.stringify(reviews));
        
        // Refresh display
        loadReviews();
    };

    // Add this at the end of your existing reviews.js file
    window.toggleReviews = function() {
        const reviewsList = document.getElementById('reviewsList');
        const showReviewsBtn = document.querySelector('.show-reviews-btn');
        
        reviewsList.classList.toggle('show');
        
        // Update button text based on state
        if (reviewsList.classList.contains('show')) {
            showReviewsBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Reviews';
        } else {
            showReviewsBtn.innerHTML = '<i class="fas fa-comments"></i> Show Reviews';
        }
    };
}); 