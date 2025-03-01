// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check if current page is login page
const isLoginPage = window.location.pathname.includes('login.html');

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.email);
  } else {
    // User is signed out
    console.log("User is signed out");
    
    // Redirect to login page if not already on login page
    if (!isLoginPage) {
      window.location.href = 'login.html';
    }
  }
});

// Export auth for use in other files
export { auth };