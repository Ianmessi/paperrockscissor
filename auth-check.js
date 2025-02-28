// Import Firebase auth
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

// List of pages that don't require authentication
const publicPages = ['login.html'];

// Check if current page requires authentication
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const requiresAuth = !publicPages.includes(currentPage);

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (requiresAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        window.location.href = 'login.html';
    } else if (currentPage === 'login.html' && user) {
        // Redirect to home if user is already logged in and tries to access login page
        window.location.href = 'index.html';
    } else if (user) {
        // Update user name if the element exists
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email;
        }
    }
});

// Make signOut function available globally
window.signOut = async function() {
    try {
        await firebaseSignOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
};