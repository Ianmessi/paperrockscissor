// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1yMW3ixCViH8DT9J3JxutLV1EHSh5vAY",
  authDomain: "rock-paper-scissors-game-fb9c7.firebaseapp.com",
  projectId: "rock-paper-scissors-game-fb9c7",
  storageBucket: "rock-paper-scissors-game-fb9c7.firebasestorage.app",
  messagingSenderId: "112666661002",
  appId: "1:112666661002:web:757106430dd7eb6a975d73",
  measurementId: "G-3738SVHBEJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase review functionality
let currentUser = null;

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadReviews(); // Load reviews when user is authenticated
    } else {
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('reviewsList');

    // Load existing reviews
    loadReviews();

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const review = document.getElementById('review').value.trim();

        if (!name || !review) {
            alert('Please fill in both name and review');
            return;
        }

        // Generate a unique ID for the reviewer
        const reviewerId = `${name}-${Date.now()}`;
        
        // Save the review
        await saveReview(name, review, reviewerId);
        
        // Clear form
        reviewForm.reset();
    });

    async function saveReview(name, review, reviewerId) {
        try {
            await addDoc(collection(db, "reviews"), {
                reviewerId: reviewerId,
                name: name,
                review: review,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now() // for ordering
            });
            loadReviews();
        } catch (error) {
            console.error("Error adding review: ", error);
            alert('Error posting review. Please try again.');
        }
    }

    async function loadReviews() {
        try {
            reviewsList.innerHTML = '<div class="loading">Loading reviews...</div>';
            
            // Create query to order reviews by timestamp
            const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            
            reviewsList.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const review = doc.data();
                const reviewElement = createReviewElement(doc.id, review);
                reviewsList.appendChild(reviewElement);
            });

            // Show reviews after loading
            reviewsList.classList.add('show');
            updateShowReviewsButton();
        } catch (error) {
            console.error("Error loading reviews: ", error);
            reviewsList.innerHTML = '<div class="error">Error loading reviews. Please try again later.</div>';
        }
    }

    function createReviewElement(docId, review) {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
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
            ${review.reviewerId === localStorage.getItem('currentReviewer') ? `
                <div class="review-actions">
                    <button class="review-button delete-review" onclick="deleteReview('${docId}', '${review.reviewerId}')">
                        Delete
                    </button>
                </div>
            ` : ''}
        `;
        return div;
    }

    // Make functions available globally
    window.deleteReview = async function(docId, reviewerId) {
        if (reviewerId !== localStorage.getItem('currentReviewer')) {
            alert('You can only delete your own reviews');
            return;
        }

        try {
            await deleteDoc(doc(db, "reviews", docId));
            loadReviews();
        } catch (error) {
            console.error("Error deleting review: ", error);
            alert('Error deleting review. Please try again.');
        }
    };

    window.toggleReviews = function() {
        reviewsList.classList.toggle('show');
        updateShowReviewsButton();
    };

    function updateShowReviewsButton() {
        const showReviewsBtn = document.querySelector('.show-reviews-btn');
        if (reviewsList.classList.contains('show')) {
            showReviewsBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Reviews';
        } else {
            showReviewsBtn.innerHTML = '<i class="fas fa-comments"></i> Show Reviews';
        }
    }
}); 