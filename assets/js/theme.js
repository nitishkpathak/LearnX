document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for saved theme preference or use default
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // 2. Select all theme toggle buttons
    const themeToggles = document.querySelectorAll('.theme-toggle');

    // Helper to switch icon forcefully
    const syncIcons = (theme) => {
        themeToggles.forEach(tBtn => {
            const i = tBtn.querySelector('i');
            if (i) {
                if (theme === 'dark') {
                    i.classList.remove('fa-moon');
                    i.classList.add('fa-sun');
                } else {
                    i.classList.remove('fa-sun');
                    i.classList.add('fa-moon');
                }
            }
        });
    };

    // Update icons upon initial load
    syncIcons(currentTheme);

    // Attach click event listeners
    themeToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent default button behavior
            e.preventDefault();
            e.stopPropagation();

            // Toggle body class
            document.body.classList.toggle('dark-mode');
            
            // Determine new theme
            const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            
            // Save preference
            localStorage.setItem('theme', newTheme);
            
            // Update all icons
            syncIcons(newTheme);
        });
    });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Force scroll to top on refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

// Search Autocomplete Logic
document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('.search-input');
    const availableCourses = [
        { title: 'HTML & CSS Masterclass', url: 'courses.html#course-web-dev' },
        { title: 'JavaScript Basics', url: 'courses.html#course-web-dev' },
        { title: 'React JS Crash Course', url: 'courses.html#course-web-dev' },
        { title: 'Python Programming', url: 'courses.html#course-data-science' },
        { title: 'Data Science Fundamentals', url: 'courses.html#course-data-science' },
        { title: 'UI/UX Design Bootcamp', url: 'courses.html#course-ui-ux' },
        { title: 'Web Development Bootcamp', url: 'courses.html#course-web-dev' }
    ];

    searchInputs.forEach(input => {
        const popup = input.parentElement.querySelector('.search-results-popup');
        if (!popup) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            popup.innerHTML = '';
            
            if (query.length > 0) {
                popup.classList.remove('d-none');
                const filtered = availableCourses.filter(c => c.title.toLowerCase().includes(query));
                
                if (filtered.length > 0) {
                    filtered.forEach(course => {
                        const item = document.createElement('div');
                        item.className = 'search-item';
                        item.textContent = course.title;
                        item.addEventListener('click', () => {
                            window.location.href = course.url;
                        });
                        popup.appendChild(item);
                    });
                } else {
                    const noResult = document.createElement('div');
                    noResult.className = 'search-item no-results';
                    noResult.textContent = 'No courses found';
                    popup.appendChild(noResult);
                }
            } else {
                popup.classList.add('d-none');
            }
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.parentElement.contains(e.target)) {
                popup.classList.add('d-none');
            }
        });

        // Handle form submission
        const form = input.closest("form[role='search']");
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = input.value.trim();
                if (query !== "") {
                    // Navigate to courses page
                    window.location.href = `courses.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
    });
});
