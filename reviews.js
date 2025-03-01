// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// Define global functions for HTML access
window.submitReview = submitReview;
window.showAllReviews = showAllReviews;
window.deleteReview = deleteReview;

// Check authentication state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log("User is signed in:", user.email);
    document.getElementById('userWelcome').textContent = `Welcome, ${user.email}!`;
    document.getElementById('reviewForm').style.display = 'block';
  } else {
    console.log("User is signed out");
    document.getElementById('userWelcome').textContent = 'Please sign in to leave a review';
    document.getElementById('reviewForm').style.display = 'none';
  }
});

// Function to submit a review
function submitReview() {
  if (!currentUser) {
    alert('Please sign in to submit a review');
    return;
  }

  const reviewText = document.getElementById('reviewText').value.trim();
  const rating = document.getElementById('rating').value;

  if (!reviewText) {
    alert('Please enter a review');
    return;
  }

  if (!rating) {
    alert('Please select a rating');
    return;
  }

  const reviewData = {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    text: reviewText,
    rating: parseInt(rating),
    timestamp: new Date()
  };

  addDoc(collection(db, "reviews"), reviewData)
    .then(() => {
      document.getElementById('reviewText').value = '';
      document.getElementById('rating').value = '';
      alert('Review submitted successfully!');
      
      // Show the reviews list after submission
      document.getElementById('reviewsList').classList.add('show');
      document.querySelector('.show-reviews-btn').innerHTML = '<i class="fas fa-comments"></i> Hide Reviews';
      
      // Make sure reviews are loaded
      loadReviews();
    })
    .catch((error) => {
      console.error("Error adding review: ", error);
      alert('Failed to submit review. Please try again.');
    });
}

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
  const reviewsList = document.getElementById('reviewsList');
  
  // Clear existing reviews
  reviewsList.innerHTML = '<div class="loading">Loading reviews...</div>';
  
  // Create a query to order reviews by timestamp
  const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
  
  // Set up real-time listener
  onSnapshot(q, (querySnapshot) => {
    reviewsList.innerHTML = '';
    if (querySnapshot.empty) {
      reviewsList.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to leave a review!</div>';
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const review = doc.data();
      const reviewElement = createReviewElement(doc.id, review);
      reviewsList.appendChild(reviewElement);
    });
  }, (error) => {
    console.error("Error loading reviews: ", error);
    reviewsList.innerHTML = '<div class="error">Error loading reviews. Please try again later.</div>';
  });
}

// Function to create a review element
function createReviewElement(docId, review) {
  const div = document.createElement('div');
  div.className = 'review-item';
  
  // Create star rating display
  const stars = '⭐'.repeat(review.rating);
  
  // Format date and time
  const date = review.timestamp.toDate();
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  
  // Determine if the current user is the author of this review
  const isAuthor = currentUser && review.userId === currentUser.uid;
  
  div.innerHTML = `
    <div class="review-header">
      <div class="reviewer-info">
        <div class="reviewer-avatar">
          ${review.userEmail.charAt(0).toUpperCase()}
        </div>
        <div class="reviewer-details">
          <div class="reviewer-name">${review.userEmail}</div>
          <div class="review-date">${formattedDate} at ${formattedTime}</div>
          <div class="rating">${stars}</div>
        </div>
      </div>
      ${isAuthor ? `
        <div class="review-actions">
          <button class="delete-review" onclick="deleteReview('${docId}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      ` : ''}
    </div>
    <div class="review-content">${review.text}</div>
  `;
  
  return div;
}

// Function to delete a review
async function deleteReview(docId) {
  if (!currentUser) {
    alert('You must be signed in to delete a review');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this review?')) {
    return;
  }
  
  try {
    const reviewRef = doc(db, "reviews", docId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      alert('Review not found');
      return;
    }
    
    if (reviewSnap.data().userId !== currentUser.uid) {
      alert('You can only delete your own reviews');
      return;
    }
    
    await deleteDoc(reviewRef);
    alert('Review deleted successfully');
  } catch (error) {
    console.error("Error deleting review: ", error);
    alert('Failed to delete review. Please try again.');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load reviews initially
  loadReviews();
  
  // Add event listeners
  document.querySelector('.show-reviews-btn').addEventListener('click', showAllReviews);
});