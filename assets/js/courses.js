/* assets/js/courses.js
   Full JS for Courses page (works with your provided HTML without changing it)
   Features:
   - Search (title/description/topics/instructor)
   - Course & instructor filtering (keyword based)
   - Wishlist toggle (heart icon)
   - Enroll action with Bootstrap toast
   - Preview course modal (Bootstrap modal created dynamically)
   - Newsletter form validation & fake submit
   - Small accessibility and UX improvements
*/

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Helpers & bootstrap helpers
     --------------------------- */
  const q = (sel, ctx = document) => ctx.querySelector(sel);
  const qa = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const debounce = (fn, wait = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  // Create a Bootstrap toast container if not present
  function ensureToastContainer() {
    let container = q('#learnx-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'learnx-toast-container';
      container.style.position = 'fixed';
      container.style.right = '1rem';
      container.style.bottom = '1rem';
      container.style.zIndex = 1080;
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, options = {}) {
    const container = ensureToastContainer();
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-dark border-0';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    container.appendChild(toastEl);
    const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: options.delay ?? 3000 });
    bsToast.show();
    // remove after hidden
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  /* ---------------------------
     Search (top navbar search)
     --------------------------- */
  const searchForm = q('.search-wrapper')?.closest('form') || q('form[role="search"]');
  const searchInput = q('.search-input');

  // Perform search across course titles, descriptions, topics, instructor names
  function searchSite(term) {
    term = (term || '').trim().toLowerCase();
    const courseCards = qa('.course-card');
    const instructorCards = qa('.instructor-card');

    if (!term) {
      // show all
      courseCards.forEach(c => c.style.display = '');
      instructorCards.forEach(i => i.style.display = '');
      return;
    }

    courseCards.forEach(card => {
      const title = (q('.course-title', card)?.innerText || '').toLowerCase();
      const desc = (q('.course-description', card)?.innerText || '').toLowerCase();
      const topics = (Array.from(qa('.course-features span', card)).map(s => s.innerText).join(' ') || '').toLowerCase();
      const instructor = (q('.course-meta span', card)?.innerText || '').toLowerCase();
      const combined = `${title} ${desc} ${topics} ${instructor}`;
      card.style.display = combined.includes(term) ? '' : 'none';
    });

    instructorCards.forEach(card => {
      const name = (q('.instructor-name', card)?.innerText || '').toLowerCase();
      const title = (q('.instructor-title', card)?.innerText || '').toLowerCase();
      const skills = (Array.from(qa('.skill-tag', card)).map(s => s.innerText).join(' ') || '').toLowerCase();
      const combined = `${name} ${title} ${skills}`;
      card.style.display = combined.includes(term) ? '' : 'none';
    });
  }

  // Expose searchSite globally for SPA routing
  window.searchSite = searchSite;

  if (searchForm && searchInput) {
    // prevent default redirect behavior (your HTML had an anchor inside button)
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      searchSite(searchInput.value);
    });

    // live search with debounce
    searchInput.addEventListener('input', debounce((e) => {
      searchSite(e.target.value);
    }, 300));
  }

  /* ---------------------------
     Course Filters (Development, Design, Marketing...)
     Keyword-based mapping (no HTML changes)
     --------------------------- */
  const courseFilterButtons = qa('.featured-courses .course-filters .filter-btn');
  const courseCards = qa('.featured-courses .course-card');

  // naive keyword-based category matcher (since HTML contains no data-category)
  function courseCategoryForCard(card) {
    const title = (q('.course-title', card)?.innerText || '').toLowerCase();
    const desc = (q('.course-description', card)?.innerText || '').toLowerCase();
    const keywords = `${title} ${desc}`;

    if (keywords.match(/\b(react|html|css|javascript|node|web|frontend|backend|bootcamp)\b/)) return 'development';
    if (keywords.match(/\b(data|python|machine learning|ml|analytics|visualization|data science)\b/)) return 'development';
    if (keywords.match(/\b(figma|ui|ux|design|adobe xd|sketch|interface|ui\/ux)\b/)) return 'design';
    if (keywords.match(/\b(marketing|seo|social|ppc|content|digital marketing)\b/)) return 'marketing';
    if (keywords.match(/\b(business|strategy|management|entrepreneur)\b/)) return 'business';
    return 'other';
  }

  function applyCourseFilter(filter) {
    courseCards.forEach(card => {
      const cat = courseCategoryForCard(card);
      if (filter === 'all' || cat === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    // update active class
    courseFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  }

  courseFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter || 'all';
      applyCourseFilter(f);
    });
  });

  /* ---------------------------
     Instructor Filters
     --------------------------- */
  const instructorFilterButtons = qa('.instructors-section .filter-btn');
  const instructorCards = qa('.instructor-card');

  function instructorCategoryForCard(card) {
    const title = (q('.instructor-title', card)?.innerText || '').toLowerCase();
    const skills = (Array.from(qa('.skill-tag', card)).map(n => n.innerText).join(' ') || '').toLowerCase();

    if (skills.match(/\b(html|css|javascript|react|web)\b/) || title.includes('developer')) return 'development';
    if (skills.match(/\b(figma|ui|ux|design|adobe)\b/) || title.includes('design')) return 'design';
    if (skills.match(/\b(python|ml|data|ai|statistics)\b/) || title.includes('data')) return 'development';
    if (title.includes('marketing') || skills.match(/\b(seo|analytics|content|ppc)\b/)) return 'marketing';
    if (title.includes('business') || skills.match(/\b(business|strategy)\b/)) return 'business';
    return 'other';
  }

  function applyInstructorFilter(filter) {
    instructorCards.forEach(card => {
      const cat = instructorCategoryForCard(card);
      if (filter === 'all' || cat === filter) {
        card.style.display = '';
      } else card.style.display = 'none';
    });
    instructorFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  }

  instructorFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter || 'all';
      applyInstructorFilter(f);
    });
  });

  /* ---------------------------
     Wishlist (heart) toggle & Enroll
     --------------------------- */
  function initWishlistButtons() {
    const wishlistBtns = qa('.wishlist-btn');
    wishlistBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const icon = q('i', btn);
        if (!icon) return;
        // toggle between regular and solid heart
        if (icon.classList.contains('far')) {
          icon.classList.remove('far');
          icon.classList.add('fas');
          showToast('Added to wishlist');
        } else {
          icon.classList.remove('fas');
          icon.classList.add('far');
          showToast('Removed from wishlist');
        }
      });
    });
  }

  function initEnrollButtons() {
    const enrollBtns = qa('.enroll-btn');
    enrollBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // find course title
        const card = btn.closest('.course-card');
        const title = card ? (q('.course-title', card)?.innerText || 'Course') : 'Course';
        // simulate enrollment flow
        showToast(`You're enrolled in "${title}" — check your dashboard!`);
        // optionally: change button text temporarily
        btn.disabled = true;
        const old = btn.innerText;
        btn.innerText = 'Enrolled ✓';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = old;
        }, 2500);
      });
    });
  }

  /* ---------------------------
     Course Preview Modal (Bootstrap modal created dynamically)
     --------------------------- */
  function createAndShowPreview({ title = '', image = '', level = '', description = '', instructor = '' } = {}) {
    // remove any existing modal
    const existing = q('#learnx-preview-modal');
    if (existing) existing.remove();

    const modalHtml = `
      <div class="modal fade" id="learnx-preview-modal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="previewModalLabel">${escapeHtml(title)}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-5">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="img-fluid rounded">
                </div>
                <div class="col-md-7">
                  <p><strong>Instructor:</strong> ${escapeHtml(instructor)}</p>
                  <p><strong>Level:</strong> ${escapeHtml(level)}</p>
                  <p>${escapeHtml(description)}</p>
                  <div class="mt-3">
                    <button class="btn btn-primary enroll-from-preview">Enroll Now</button>
                    <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = q('#learnx-preview-modal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    // Enroll from preview
    q('.enroll-from-preview', modalEl).addEventListener('click', () => {
      bsModal.hide();
      showToast(`You're enrolled in "${title}" — welcome aboard!`);
    });

    // cleanup when hidden
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initPreviewButtons() {
    const previewBtns = qa('.preview-btn');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.course-card');
        const title = q('.course-title', card)?.innerText || 'Course Preview';
        const img = q('.course-image img', card)?.src || '';
        const level = q('.course-overlay .course-level', card)?.innerText || '';
        const desc = q('.course-description', card)?.innerText || '';
        const instructor = (q('.course-meta span', card)?.innerText || '').replace(/\n/g, ' ');
        createAndShowPreview({ title, image: img, level, description: desc, instructor });
      });
    });
  }

  /* ---------------------------
     Newsletter form handling
     --------------------------- */
  const newsletterForm = q('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = newsletterForm.querySelector('input[type="text"]')?.value?.trim() || '';
      const email = newsletterForm.querySelector('input[type="email"]')?.value?.trim() || '';
      const select = newsletterForm.querySelector('select')?.value || '';

      // simple validation
      if (!name) return showToast('Please enter your name.');
      if (!validateEmail(email)) return showToast('Please enter a valid email.');
      if (!select) return showToast('Please select an interest.');

      // fake subscribe (no backend)
      showToast(`Thanks ${name}! Subscribed for ${select} updates.`);
      newsletterForm.reset();
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ---------------------------
     Small accessibility & keyboard support
     --------------------------- */
  // allow Enter on cards to preview (when focused)
  function makeCardsKeyboardAccessible() {
    qa('.course-card, .instructor-card').forEach(card => {
      card.tabIndex = 0;
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // try to open preview if course, otherwise toggle first link
          if (card.closest('.featured-courses')) {
            const preview = q('.preview-btn', card);
            if (preview) preview.click();
          } else {
            const link = q('a', card);
            if (link) link.click();
          }
        }
      });
    });
  }

  /* ---------------------------
     Page init
     --------------------------- */
  function initAll() {
    initWishlistButtons();
    initEnrollButtons();
    initPreviewButtons();
    makeCardsKeyboardAccessible();
    // initial show all (in case any inline styles)
    applyCourseFilter('all');
    applyInstructorFilter('all');
  }

  initAll();

  /* ---------------------------
     Utility: expose some functions to window for debugging
     --------------------------- */
  window.LearnX = {
    searchSite,
    applyCourseFilter,
    applyInstructorFilter,
    showToast
  };

  /* ---------------------------
     Extra: close mobile navbar when clicking a link (good UX)
     --------------------------- */
  const navCollapse = q('.navbar-collapse');
  qa('.navbar-nav a').forEach(anchor => {
    anchor.addEventListener('click', () => {
      if (navCollapse && navCollapse.classList.contains('show')) {
        // use Bootstrap collapse API
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse, { toggle: false });
        bsCollapse.hide();
      }
    });
  });

}); // DOMContentLoaded end
