// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);
let currentUser = null;

// Define global functions for HTML access
window.submitReview = async function() {
  if (!currentUser) {
    alert('Please sign in to submit a review');
    return;
  }

  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value;

  if (!rating || !comment) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const reviewsRef = ref(database, 'reviews');
    const newReviewRef = push(reviewsRef);
    
    await set(newReviewRef, {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      rating: parseInt(rating),
      comment: comment,
      timestamp: Date.now()
    });

    // Clear form
    document.getElementById('rating').value = '';
    document.getElementById('comment').value = '';
    
    // Reload reviews
    loadReviews();
    
    alert('Review submitted successfully!');
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Error submitting review. Please try again.');
  }
};
window.showAllReviews = showAllReviews;
window.deleteReview = deleteReview;

// Check authentication state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log("User is signed in:", user.email);
    document.getElementById('userWelcome').textContent = `Welcome, ${user.email}`;
    document.getElementById('authButton').style.display = 'none';
    document.getElementById('reviewForm').style.display = 'block';
    loadReviews();
  } else {
    console.log("User is signed out");
    document.getElementById('userWelcome').textContent = 'Please sign in to leave a review';
    document.getElementById('authButton').style.display = 'block';
    document.getElementById('reviewForm').style.display = 'none';
  }
});

// Function to show/hide all reviews
function showAllReviews() {
  const reviewsList = document.getElementById('reviewsList');
  const button = document.querySelector('.show-reviews-btn');
  
  if (reviewsList.classList.contains('show')) {
    reviewsList.classList.remove('show');
    button.innerHTML = '<i class="fas fa-comments"></i> Show All Reviews';
  } else {
    reviewsList.classList.add('show');
    button.innerHTML = '<i class="fas fa-comments"></i> Hide Reviews';
    loadReviews();
  }
}

// Function to load reviews
function loadReviews() {
  const reviewsRef = ref(database, 'reviews');
  onValue(reviewsRef, (snapshot) => {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '';
    
    const reviews = [];
    snapshot.forEach((childSnapshot) => {
      reviews.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort reviews by timestamp (newest first)
    reviews.sort((a, b) => b.timestamp - a.timestamp);
    
    reviews.forEach(review => {
      const reviewElement = createReviewElement(review);
      reviewsList.appendChild(reviewElement);
    });
  });
}

// Function to create a review element
function createReviewElement(review) {
  const div = document.createElement('div');
  div.className = 'review-item';
  
  const date = new Date(review.timestamp).toLocaleDateString();
  
  div.innerHTML = `
    <div class="review-header">
      <div class="reviewer-info">
        <div class="reviewer-avatar">${review.userEmail[0].toUpperCase()}</div>
        <div class="reviewer-details">
          <div class="reviewer-name">${review.userEmail}</div>
          <div class="review-date">${date}</div>
        </div>
      </div>
      ${currentUser && currentUser.uid === review.userId ? 
        `<button onclick="deleteReview('${review.id}')" class="delete-review">
          <i class="fas fa-trash"></i> Delete
        </button>` : ''}
    </div>
    <div class="rating">
      ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
    </div>
    <div class="review-content">${review.comment}</div>
  `;
  
  return div;
}

// Function to delete a review
async function deleteReview(reviewId) {
  if (!currentUser) return;
  
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    await remove(reviewRef);
    alert('Review deleted successfully!');
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Error deleting review. Please try again.');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load reviews initially
  loadReviews();
  
  // Add event listeners
  document.querySelector('.show-reviews-btn').addEventListener('click', showAllReviews);
});