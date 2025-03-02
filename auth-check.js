// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAjm0fBJkYtQZz_vUh6XVE5VKHBqLZuWwE",
    authDomain: "rock-paper-scissors-d0f48.firebaseapp.com",
    projectId: "rock-paper-scissors-d0f48",
    storageBucket: "rock-paper-scissors-d0f48.appspot.com",
    messagingSenderId: "1096965280560",
    appId: "1:1096965280560:web:c0c2c0e1d5e10c9c7c2c0c",
    databaseURL: "https://rock-paper-scissors-d0f48-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check authentication state
onAuthStateChanged(auth, (user) => {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!user && currentPage !== 'login.html') {
        // If user is not authenticated and not on login page, redirect to login
        window.location.href = 'login.html';
    } else if (user && currentPage === 'login.html') {
        // If user is authenticated and on login page, redirect to home
        window.location.href = 'index.html';
    }
});

// Export auth for use in other files
export { auth };