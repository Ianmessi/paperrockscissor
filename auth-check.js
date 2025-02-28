// List of pages that don't require authentication
const publicPages = ['login.html'];

// Check if current page is public
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const isPublicPage = publicPages.includes(currentPage);

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (!user && !isPublicPage) {
        // Redirect to login if not authenticated and trying to access protected page
        window.location.href = 'login.html';
    } else if (user && currentPage === 'login.html') {
        // Redirect to index if already authenticated and trying to access login page
        window.location.href = 'index.html';
    }

    // If authenticated, update UI elements that show user info
    if (user) {
        updateUserUI(user);
    }
});

// Function to update UI elements with user info
function updateUserUI(user) {
    // Update any UI elements that should show user info
    const userElements = document.querySelectorAll('.user-info');
    userElements.forEach(element => {
        if (element.classList.contains('user-name')) {
            element.textContent = user.displayName || user.email;
        }
    });
} 