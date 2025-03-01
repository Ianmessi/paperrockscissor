// Initialize Firebase Auth
const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const googleLoginBtn = document.getElementById('googleLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Show/Hide Forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    errorMessage.style.display = 'none';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    errorMessage.style.display = 'none';
});

// Login function
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successful login
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
}

// Sign up function
function signup() {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorMessage = document.getElementById('signup-error-message');

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update profile with username
            return userCredential.user.updateProfile({
                displayName: username
            });
        })
        .then(() => {
            // Create user record in database
            const user = auth.currentUser;
            return firebase.database().ref('users/' + user.uid).set({
                username: username,
                email: email,
                stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0
                }
            });
        })
        .then(() => {
            // Redirect to home page
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
}

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const errorMessage = document.getElementById('error-message');

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Check if user exists in database
            return firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        // Create new user record
                        return firebase.database().ref('users/' + user.uid).set({
                            username: user.displayName,
                            email: user.email,
                            stats: {
                                gamesPlayed: 0,
                                wins: 0,
                                losses: 0,
                                draws: 0
                            }
                        });
                    }
                });
        })
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
}

// Toggle between login and signup forms
function showSignupForm() {
    document.querySelector('.login-box').style.display = 'none';
    document.querySelector('.signup-box').style.display = 'block';
}

function showLoginForm() {
    document.querySelector('.signup-box').style.display = 'none';
    document.querySelector('.login-box').style.display = 'block';
}

// Forgot Password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;

    if (!email) {
        showError('Please enter your email address');
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showError('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
        showError(error.message);
    }
});

// Show Error Message
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    if (type === 'success') {
        errorMessage.style.background = 'rgba(46, 204, 113, 0.2)';
        errorMessage.style.border = '1px solid rgba(46, 204, 113, 0.5)';
    } else {
        errorMessage.style.background = 'rgba(231, 76, 60, 0.2)';
        errorMessage.style.border = '1px solid rgba(231, 76, 60, 0.5)';
    }

    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Check Authentication State
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
}); 