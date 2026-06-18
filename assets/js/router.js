/**
 * router.js
 * Client-side routing logic for LearnX SPA
 */

const API_BASE_URL = window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:' || 
    !window.location.hostname
    ? 'http://localhost:5000'
    : 'https://learnx-backend-wygd.onrender.com';


function switchView(viewName, hash) {
    console.log("Switching view to:", viewName, "hash:", hash);
    const publicSite = document.getElementById('public-site-view');
    const isDashboardPage = !!document.getElementById('dashboard-view');
    
    if (viewName === 'dashboard') {
        const token = localStorage.getItem('learnx_token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Access Denied',
                text: 'Please log in to access your dashboard.',
                timer: 3000,
                showConfirmButton: false
            });
            // Open login modal
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) {
                const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
                loginModal.show();
            }
            return;
        }
        
        // Save active view state for session persistence
        localStorage.setItem('learnx_active_view', 'dashboard');
        
        if (!isDashboardPage) {
            // Redirect to dashboard page
            window.location.href = 'dashboard.html';
            return;
        }
        
        document.body.classList.add('dashboard-active');
        
        // Load dashboard data if dashboard.js is loaded
        if (typeof initDashboard === 'function') {
            initDashboard();
        }
        
        // Sync theme setting toggle
        const settingsThemeToggle = document.getElementById('settingsThemeToggle');
        if (settingsThemeToggle) {
            settingsThemeToggle.checked = document.body.classList.contains('dark-mode');
        }
    } else {
        // Public views: home, courses, about, contact
        localStorage.setItem('learnx_active_view', viewName);
        
        if (isDashboardPage) {
            // Redirect from dashboard.html to index.html with appropriate hash
            window.location.href = 'index.html' + (hash || '#' + viewName);
            return;
        }
        
        if (publicSite) publicSite.style.display = 'block';
        document.body.classList.remove('dashboard-active');
        
        // Update public navbar link active styles
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const onClickAttr = link.getAttribute('onclick');
            if (onClickAttr && onClickAttr.includes(`'${viewName}'`)) {
                link.classList.add('active');
            }
        });

        // Determine target element for scroll
        let scrollTarget = null;
        if (hash) {
            scrollTarget = document.querySelector(hash);
        } else {
            if (viewName === 'home') {
                scrollTarget = document.getElementById('home');
            } else if (viewName === 'courses') {
                scrollTarget = document.getElementById('courses-section');
            } else if (viewName === 'about') {
                scrollTarget = document.getElementById('about-us-section');
            } else if (viewName === 'contact') {
                scrollTarget = document.getElementById('contact-section');
            }
        }

        // Scroll smoothly to target element
        if (scrollTarget) {
            setTimeout(() => {
                scrollTarget.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Run routing on initial load and handle hash params
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const showParam = params.get('show');
    const token = localStorage.getItem('learnx_token');
    const activeView = localStorage.getItem('learnx_active_view');
    const hash = window.location.hash;
    const isDashboardPage = !!document.getElementById('dashboard-view');
    
    // Automatically open login modal if show=login query parameter is present
    if (showParam === 'login') {
        setTimeout(() => {
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) {
                const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
                loginModal.show();
            }
        }, 300);
    }
    
    if (isDashboardPage) {
        // Authenticated validation on dashboard.html
        if (!token) {
            window.location.href = 'index.html?show=login';
        } else {
            switchView('dashboard');
        }
    } else {
        // Landing page routing
        if (hash) {
            if (hash.startsWith('#courses')) {
                switchView('courses', hash.replace('#courses', ''));
            } else if (hash.startsWith('#about')) {
                switchView('about');
            } else if (hash.startsWith('#contact')) {
                switchView('contact');
            } else {
                switchView('home');
            }
        } else {
            if (activeView && activeView !== 'dashboard') {
                switchView(activeView);
            } else if (viewParam === 'dashboard' && token) {
                switchView('dashboard');
            } else {
                switchView('home');
            }
        }
    }
    
    // Hash change handler for routing triggers
    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash;
        if (isDashboardPage) {
            if (currentHash && currentHash !== '#dashboard') {
                window.location.href = 'index.html' + currentHash;
            }
        } else {
            if (currentHash.startsWith('#courses')) {
                switchView('courses', currentHash.replace('#courses', ''));
            } else if (currentHash.startsWith('#about')) {
                switchView('about');
            } else if (currentHash.startsWith('#contact')) {
                switchView('contact');
            } else if (currentHash.startsWith('#home') || currentHash === '') {
                switchView('home');
            }
        }
    });
});
