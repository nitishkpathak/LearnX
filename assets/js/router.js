/**
 * router.js
 * Client-side routing logic for LearnX SPA
 */

function switchView(viewName, hash) {
    console.log("Switching view to:", viewName, "hash:", hash);
    const publicSite = document.getElementById('public-site-view');
    const dashboardView = document.getElementById('dashboard-view');
    
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
        
        // Hide public site, show dashboard
        if (publicSite) publicSite.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'block';
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
        if (dashboardView) dashboardView.style.display = 'none';
        if (publicSite) publicSite.style.display = 'block';
        document.body.classList.remove('dashboard-active');
        
        // Hide all public subviews
        const subviews = document.querySelectorAll('.public-subview');
        subviews.forEach(sv => sv.style.display = 'none');
        
        // Show target subview
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        // Update public navbar link active styles
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const onClickAttr = link.getAttribute('onclick');
            if (onClickAttr && onClickAttr.includes(`'${viewName}'`)) {
                link.classList.add('active');
            }
        });

        // Scroll to target element or top
        if (hash) {
            const targetEl = document.querySelector(hash);
            if (targetEl) {
                setTimeout(() => {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Run routing on initial load and handle hash params
document.addEventListener('DOMContentLoaded', () => {
    // Check query parameters
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    
    if (viewParam === 'dashboard' || localStorage.getItem('learnx_token')) {
        // If logged in, show dashboard or home depending on preference
        if (viewParam === 'dashboard') {
            switchView('dashboard');
        } else {
            switchView('home');
        }
    } else {
        switchView('home');
    }
    
    // Hash change handler for routing triggers (e.g. #courses-view, #contact-view)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash.startsWith('#courses')) {
            switchView('courses', hash.replace('#courses', ''));
        } else if (hash.startsWith('#about')) {
            switchView('about');
        } else if (hash.startsWith('#contact')) {
            switchView('contact');
        } else if (hash.startsWith('#home') || hash === '') {
            switchView('home');
        }
    });
});
