// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('reviewsList');
    const showReviewsBtn = document.getElementById('showReviewsBtn');
    let currentUser = null;
    let unsubscribe = null;

    // Auth state observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('userName').textContent = user.displayName || user.email;
            setupRealtimeUpdates();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Show/Hide reviews button
    showReviewsBtn.addEventListener('click', () => {
        reviewsList.classList.toggle('show');
        showReviewsBtn.textContent = reviewsList.classList.contains('show') ? 'Hide Reviews' : 'Show All Reviews';
    });

    // Handle review submission
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const reviewText = document.getElementById('reviewText').value.trim();
        const rating = document.getElementById('rating').value;

        if (!reviewText || !rating) {
            alert('Please fill in both the review and rating');
            return;
        }

        try {
            await addDoc(collection(db, "reviews"), {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userPhoto: currentUser.photoURL,
                review: reviewText,
                rating: parseInt(rating),
                timestamp: new Date().toISOString()
            });
            
            reviewForm.reset();
            reviewsList.classList.add('show');
            showReviewsBtn.textContent = 'Hide Reviews';
        } catch (error) {
            console.error("Error adding review: ", error);
            alert('Error posting review. Please try again.');
        }
    });

    function setupRealtimeUpdates() {
        if (unsubscribe) {
            unsubscribe();
        }

        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                reviewsList.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
                return;
            }

            reviewsList.innerHTML = '';
            snapshot.forEach((doc) => {
                const review = doc.data();
                const reviewElement = createReviewElement(doc.id, review);
                reviewsList.appendChild(reviewElement);
            });
        }, (error) => {
            console.error("Error setting up real-time updates: ", error);
            reviewsList.innerHTML = '<div class="error">Error loading reviews. Please try again later.</div>';
        });
    }

    function createReviewElement(docId, review) {
        const div = document.createElement('div');
        div.className = 'review-item';
        
        const stars = '⭐'.repeat(review.rating);
        const reviewDate = new Date(review.timestamp);
        
        div.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    ${review.userPhoto ? 
                        `<img src="${review.userPhoto}" alt="${review.userName}" class="reviewer-avatar">` :
                        `<div class="reviewer-avatar">${review.userName.charAt(0).toUpperCase()}</div>`}
                    <div class="reviewer-details">
                        <h3 class="reviewer-name">${review.userName}</h3>
                        <div class="review-date">${reviewDate.toLocaleDateString()} at ${reviewDate.toLocaleTimeString()}</div>
                        <div class="rating">${stars}</div>
                    </div>
                </div>
                ${currentUser && review.userId === currentUser.uid ? `
                    <button class="delete-review" onclick="deleteReview('${docId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
            <div class="review-content">${review.review}</div>
        `;
        return div;
    }

    // Make delete function available globally
    window.deleteReview = async function(docId) {
        if (confirm('Are you sure you want to delete this review?')) {
            try {
                await deleteDoc(doc(db, "reviews", docId));
            } catch (error) {
                console.error("Error deleting review: ", error);
                alert('Error deleting review. Please try again.');
            }
        }
    };
}); 