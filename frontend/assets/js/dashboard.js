// Auth token holder
let token = localStorage.getItem('learnx_token');

// Global user state
let currentUser = null;
let courses = [];
let assignments = [];
let profile = {};

// Load cached user profile from localStorage immediately to prevent flicker/stale info on refresh
(function loadCachedProfile() {
  const cachedUserStr = localStorage.getItem('learnx_user');
  if (cachedUserStr) {
    try {
      const cachedUser = JSON.parse(cachedUserStr);
      if (cachedUser && cachedUser.name) {
        profile = {
          name: cachedUser.name,
          email: cachedUser.email || '',
          studentId: cachedUser.studentId || 'N/A',
          dp: cachedUser.dp || null,
          joined: cachedUser.joined || 'N/A',
          xp: cachedUser.xp || 0
        };
        
        // Update header XP value immediately
        const headerXpValue = document.getElementById('headerXpValue');
        if (headerXpValue) {
          headerXpValue.innerText = `${cachedUser.xp || 0} XP`;
        }
        
        // Update welcome banner immediately
        const welcomeText = document.querySelector('.welcome-banner h2');
        if (welcomeText) {
          const firstName = cachedUser.name.split(' ')[0];
          welcomeText.innerText = `Welcome back, ${firstName}! 👋`;
        }
        
        // Update header avatar immediately
        const headerAvatar = document.querySelector('.profile-pic');
        const avatarUrl = cachedUser.dp ? cachedUser.dp : `https://ui-avatars.com/api/?name=${encodeURIComponent(cachedUser.name)}&background=6366f1&color=fff&size=200`;
        if (headerAvatar) {
          headerAvatar.src = avatarUrl;
        }
      }
    } catch (e) {
      console.error("Error loading cached profile:", e);
    }
  }
})();

// Sidebar toggle
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
if (menuBtn && sidebar) {
  menuBtn.addEventListener('click', () => sidebar.classList.toggle('show'));
}

// Navigation (scoped to dashboard view to prevent hiding landing sections)
const sections = document.querySelectorAll('#dashboard-view .section');
const navItems = document.querySelectorAll('#dashboard-view .sidebar ul li[data-section]');

// Profile picture click to go to profile section
const profilePicEl = document.querySelector('.profile-pic');
if(profilePicEl) {
    profilePicEl.addEventListener('click', () => {
        document.querySelector('.sidebar ul li[data-section="profile"]').click();
    });
}

navItems.forEach(li => {
  li.addEventListener('click', () => {
    navItems.forEach(item => item.classList.remove('active'));
    li.classList.add('active');

    const target = li.getAttribute('data-section');
    sections.forEach(s => {
      s.style.display = 'none';
      s.style.opacity = '0';
    });
    
    const targetId = target === 'courses' ? 'dashboardCoursesSection' : target;
    const targetSection = document.getElementById(targetId);
    if(targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
        targetSection.style.opacity = '1';
        targetSection.style.transition = 'opacity 0.3s ease';
        }, 50);
    }

    if (target === 'certificates') {
        loadCertificates();
    }

    if (target === 'leaderboard') {
        loadLeaderboard();
    }

    if (window.innerWidth <= 992) sidebar.classList.remove('show');
  });
});

// Logout
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('learnx_auth');
      localStorage.removeItem('learnx_user');
      localStorage.removeItem('learnx_token');
      
      // Reset landing page buttons
      document.querySelectorAll('.featured-courses .enroll-btn').forEach(btn => {
        btn.disabled = false;
        btn.innerText = 'Enroll Now';
      });

      // Reset navbar state and switch view to home
      if (typeof updateNavbarAuthState === 'function') {
          updateNavbarAuthState();
      }
      switchView('home');
    }
  });
}

// Load Dashboard Data from API
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/data?_=${Date.now()}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            
            // Map data
            courses = currentUser.enrolledCourses || [];

            // Client-side auto-enrollment fallback for existing/old users
            const defaultFeaturedCourses = [
              { courseId: 'course-web-dev', name: 'Complete Web Development Bootcamp 2024', instructor: 'John Doe', img: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500' },
              { courseId: 'course-data-science', name: 'Data Science and Machine Learning', instructor: 'Sarah Johnson', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500' },
              { courseId: 'course-ui-ux', name: 'UI/UX Design Masterclass 2024', instructor: 'Mike Wilson', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500' }
            ];

            let enrolledNew = false;
            for (let defC of defaultFeaturedCourses) {
              const isEnrolled = courses.some(c => c.courseId === defC.courseId);
              if (!isEnrolled) {
                try {
                  await fetch(`${API_BASE_URL}/api/dashboard/enroll`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(defC)
                  });
                  enrolledNew = true;
                } catch (err) {
                  console.error("Auto-enroll error:", err);
                }
              }
            }

            if (enrolledNew) {
              fetchDashboardData();
              return;
            }
            assignments = currentUser.assignments || [];
            profile = {
                name: currentUser.name,
                email: currentUser.email,
                studentId: currentUser.studentId || 'N/A',
                dp: currentUser.dp || null,
                joined: new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                xp: currentUser.xp || 0,
                badges: currentUser.badges || []
            };

            // Update header XP value
            const headerXpValue = document.getElementById('headerXpValue');
            if (headerXpValue) {
              headerXpValue.innerText = `${profile.xp} XP`;
            }
            
            // Sync with local storage
            localStorage.setItem("learnx_user", JSON.stringify({
                id: currentUser._id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone,
                education: currentUser.education,
                studentId: profile.studentId,
                dp: profile.dp,
                joined: profile.joined,
                xp: profile.xp,
                badges: profile.badges
            }));
            
            renderDynamicContent();
            setupSettings(currentUser.settings);
        } else if (response.status === 401 || response.status === 403) {
            console.error("Session expired or unauthorized.");
            // Session expired/invalid -> clear tokens and redirect to login
            localStorage.removeItem('learnx_auth');
            localStorage.removeItem('learnx_user');
            localStorage.removeItem('learnx_token');
            localStorage.removeItem('learnx_active_view');
            
            Swal.fire({
                icon: 'warning',
                title: 'Session Expired',
                text: 'Your session has expired. Please log in again.',
                timer: 3000,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                switchView('home');
                if (typeof updateNavbarAuthState === 'function') {
                    updateNavbarAuthState();
                }
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) {
                    const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
                    loginModal.show();
                }
            }, 1500);
        } else {
            console.error("Failed to fetch dashboard data.");
        }
    } catch (error) {
        console.error("Server Error:", error);
    }
}

// Render Courses
function loadCourses() {
  const courseList = document.getElementById('courseList');
  const dashboardCourseList = document.getElementById('dashboardCourseList');
  
  if(courseList) courseList.innerHTML = '';
  if(dashboardCourseList) dashboardCourseList.innerHTML = '';

  if(courses.length === 0 && courseList) {
      courseList.innerHTML = '<p class="text-muted p-3">You are not enrolled in any courses yet.</p>';
  }

  courses.forEach((c, index) => {
    const html = `
      <div class="course-card glass">
        <img src="${c.img || 'assets/images/python.png'}" alt="${c.name}" class="course-img">
        <div class="course-content">
          <h3>${c.name}</h3>
          <p class="instructor"><i class="fas fa-chalkboard-teacher"></i> ${c.instructor || 'LearnX Instructor'}</p>
          <div class="progress-container">
            <div class="progress-text">
              <span>Progress</span>
              <span>${c.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%" data-width="${c.progress}%"></div>
            </div>
          </div>
          <button class="btn-primary continue-course-btn" data-id="${c.courseId}" style="margin-top: 15px; padding: 10px; width: 100%; font-size: 0.95rem;">
            ${c.progress === 100 ? 'Review Course' : 'Continue Course'}
          </button>
        </div>
      </div>
    `;
    if(courseList) courseList.innerHTML += html;
    if(dashboardCourseList) dashboardCourseList.innerHTML += html;
  });

  const enrolledCountEl = document.getElementById('enrolledCount');
  if(enrolledCountEl) enrolledCountEl.innerText = courses.length;

  // Sync landing page "Enroll Now" buttons
  const landingEnrollBtns = document.querySelectorAll('.featured-courses .enroll-btn');
  landingEnrollBtns.forEach(btn => {
    btn.disabled = false;
    btn.innerText = 'Enroll Now';
  });

  courses.forEach(c => {
    if (c.courseId) {
      const cardCol = document.getElementById(c.courseId);
      if (cardCol) {
        const btn = cardCol.querySelector('.enroll-btn');
        if (btn) {
          btn.innerText = 'Enrolled ✓';
          btn.disabled = true;
        }
      }
    }
  });

  // Bind Continue Course buttons
  document.querySelectorAll('.continue-course-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openCoursePlayer(id);
      });
  });

  setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach(fill => {
      fill.style.width = fill.getAttribute('data-width');
    });
  }, 100);
}

// Render Assignments
function loadAssignments(filter = 'all') {
  const assignmentList = document.getElementById('assignmentList');
  if(!assignmentList) return;
  assignmentList.innerHTML = '';
  
  let filteredAssignments = assignments;
  if (filter !== 'all') {
    filteredAssignments = assignments.filter(a => a.status.toLowerCase() === filter);
  }
  
  if (filteredAssignments.length === 0) {
      assignmentList.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-muted);">No assignments found.</p>';
  }

  filteredAssignments.forEach(a => {
    let badgeClass = a.status.toLowerCase();
    let iconColor = a.status === 'Completed' ? '#22c55e' : (a.status === 'Pending' ? '#f59e0b' : '#ef4444');
    let bgClass = a.status === 'Completed' ? 'rgba(34,197,94,0.1)' : (a.status === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)');

    const actionBtn = a.status === 'Pending' 
      ? `<button class="btn-primary submit-assignment-btn" data-id="${a._id}" style="padding: 6px 12px; font-size: 0.8rem; margin-top: 10px;">Submit</button>` 
      : '';

    const html = `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-icon" style="color: ${iconColor}; background: ${bgClass};">
            <i class="fas ${a.icon || 'fa-tasks'}"></i>
          </div>
          <div class="list-info">
            <h4>${a.title}</h4>
            <p>${a.dueDate}</p>
            ${actionBtn}
          </div>
        </div>
        <span class="badge ${badgeClass}">${a.status}</span>
      </div>
    `;
    assignmentList.innerHTML += html;
  });

  const completed = assignments.filter(a => a.status === 'Completed').length;
  const completedAssignmentsEl = document.getElementById('completedAssignments');
  if(completedAssignmentsEl) completedAssignmentsEl.innerText = completed;

  // Bind Submit Assignment buttons
  document.querySelectorAll('.submit-assignment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const listItem = btn.closest('.list-item');
          const title = listItem ? listItem.querySelector('h4').innerText : 'Assignment';
          
          document.getElementById('submitAssignmentId').value = id;
          document.getElementById('submitAssignmentTitle').value = title;
          document.getElementById('submitAssignmentUrl').value = '';
          document.getElementById('submitAssignmentNotes').value = '';
          
          document.getElementById('submitAssignmentModal').classList.add('active');
      });
  });
}

// API: Submit Assignment
async function submitAssignment(assignmentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/assignment/${assignmentId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if(response.ok) {
            Swal.fire({
                title: 'Success!',
                text: 'Assignment Submitted successfully!',
                icon: 'success',
                confirmButtonColor: '#6366f1'
            });
            fetchDashboardData(); // Refresh data
        }
    } catch(err) {
        console.error(err);
        Swal.fire({
            title: 'Error',
            text: 'Failed to submit assignment.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Render Profile
function loadProfile() {
  const p = document.getElementById('profileCard');
  if(!p) return;
  
  const headerAvatar = document.querySelector('.profile-pic');
  const avatarUrl = profile.dp ? profile.dp : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff&size=200`;
  if(headerAvatar) headerAvatar.src = avatarUrl;
  
  const welcomeText = document.querySelector('.welcome-banner h2');
  if(welcomeText) {
      const firstName = profile.name.split(' ')[0];
      welcomeText.innerText = `Welcome back, ${firstName}! 👋`;
  }

  p.innerHTML = `
    <div class="profile-header">
      <img src="${avatarUrl}" alt="Profile" class="profile-avatar">
      <div class="profile-info">
        <h3>${profile.name}</h3>
        <p><i class="fas fa-envelope"></i> ${profile.email}</p>
        <button id="editProfileBtn" class="btn-primary" style="margin-top: 15px; padding: 8px 16px; font-size: 0.9rem;">
            <i class="fas fa-edit"></i> Edit Profile
        </button>
      </div>
    </div>
    <div class="profile-details">
      <div class="detail-box">
        <label>Student ID</label>
        <span>${profile.studentId}</span>
      </div>
      <div class="detail-box">
        <label>Joined Date</label>
        <span>${profile.joined}</span>
      </div>
      <div class="detail-box">
        <label>Courses Enrolled</label>
        <span>${courses.length}</span>
      </div>
    </div>
  `;

  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const modal = document.getElementById('editProfileModal');
      if (modal) {
          document.getElementById('editName').value = profile.name;
          document.getElementById('editEmail').value = profile.email;
          modal.classList.add('active');
      }
    });
  }
}

// Render Progress
function loadProgress() {
  const total = courses.length;
  const progressSum = courses.reduce((a, b) => a + b.progress, 0);
  const percent = total ? Math.round(progressSum / total) : 0;
  
  const progPercentEl = document.getElementById('progressPercent');
  if(progPercentEl) progPercentEl.innerText = percent + '%';
  
  const overallDisplay = document.getElementById('progressPercentDisplay');
  if(overallDisplay) overallDisplay.innerText = percent + '%';
  
  const overallProg = document.getElementById('overallProgress');
  if(overallProg) {
    overallProg.style.width = '0%';
    setTimeout(() => {
      overallProg.style.width = percent + '%';
    }, 100);
  }

  const list = document.getElementById('courseProgressList');
  if(!list) return;
  list.innerHTML = '';
  
  courses.forEach(c => {
    const html = `
      <div class="list-item" style="display:block; padding: 15px 20px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <h4 style="font-size:1.1rem;">${c.name}</h4>
          <span style="font-weight:600; color:var(--primary);">${c.progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%" data-width="${c.progress}%"></div>
        </div>
      </div>
    `;
    list.innerHTML += html;
  });
}

function renderDynamicContent() {
  loadCourses();
  loadAssignments('all');
  loadProfile();
  loadProgress();
}

// Assignment Filters
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadAssignments(btn.getAttribute('data-filter'));
  });
});

// Profile Edit Modal Logic
const modal = document.getElementById('editProfileModal');
const closeBtn = document.getElementById('closeProfileModal');
const editForm = document.getElementById('editProfileForm');

if (closeBtn && modal) {
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.classList.remove('active');
  });
}

if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('editName').value;
    const newEmail = document.getElementById('editEmail').value;
    const dpInput = document.getElementById('editDp');
    
    let dpBase64 = null;
    if (dpInput && dpInput.files && dpInput.files[0]) {
      dpBase64 = await compressAndResizeImage(dpInput.files[0]);
    }

    try {
        const payload = { name: newName, email: newEmail };
        if(dpBase64) payload.dp = dpBase64;

        const res = await fetch(`${API_BASE_URL}/api/dashboard/profile`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            const updatedUser = await res.json();
            localStorage.setItem("learnx_user", JSON.stringify({
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                education: updatedUser.education,
                studentId: updatedUser.studentId,
                dp: updatedUser.dp || null,
                joined: new Date(updatedUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            }));

            Swal.fire({
                title: 'Success!',
                text: 'Profile Updated successfully!',
                icon: 'success',
                confirmButtonColor: '#6366f1'
            });
            modal.classList.remove('active');
            fetchDashboardData();
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update profile.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    } catch(err) {
        console.error(err);
        Swal.fire({
            title: 'Error',
            text: 'Connection error.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    }
  });
}

// Compress and resize image in client to prevent PayloadTooLarge/timeout errors
function compressAndResizeImage(file, maxWidth = 300, maxHeight = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Settings Logic
function setupSettings(settings) {
    const s = settings || { emailNotif: true, pushNotif: false, theme: 'light' };

    const emailToggle = document.getElementById('emailNotifToggle');
    const pushToggle = document.getElementById('pushNotifToggle');
    const settingsThemeToggle = document.getElementById('settingsThemeToggle');

    if (emailToggle) {
        emailToggle.checked = !!s.emailNotif;
        emailToggle.onchange = (e) => updateSettings({ emailNotif: e.target.checked });
    }

    if (pushToggle) {
        pushToggle.checked = !!s.pushNotif;
        pushToggle.onchange = (e) => updateSettings({ pushNotif: e.target.checked });
    }

    if (settingsThemeToggle) {
        // Sync theme setting from backend/DB
        if (s.theme) {
            window.applyTheme(s.theme);
        }

        settingsThemeToggle.onchange = (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            window.applyTheme(theme);
            updateSettings({ theme });
        };
    }
}

async function updateSettings(updates) {
    try {
        await fetch(`${API_BASE_URL}/api/dashboard/settings`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(updates)
        });
    } catch(err) {
        console.error("Settings update failed", err);
    }
}
window.updateSettings = updateSettings;

// Announcements "Mark as read"
const announcementItems = document.querySelectorAll('#announcements .list-item');
announcementItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
        const badge = item.querySelector('.badge');
        if(badge && badge.style.display !== 'none') {
            badge.style.display = 'none'; 
            item.style.opacity = '0.7'; 
        }
    });
});

// Globally accessible init function
function initDashboard() {
    token = localStorage.getItem('learnx_token');
    if (token) {
        fetchDashboardData();
    }
}
window.initDashboard = initDashboard;

// ================== ✅ COURSE PLAYER LOGIC ==================
let activeCourseId = null;
let activeLectureIndex = 0;

function openCoursePlayer(courseId) {
  const course = courses.find(c => c.courseId === courseId);
  if (!course) return;

  activeCourseId = courseId;
  activeLectureIndex = Math.min(3, Math.floor(course.progress / 25));

  // Hide all sections
  sections.forEach(s => {
    s.style.display = 'none';
    s.style.opacity = '0';
  });

  // Show Course Player Section
  const playerSection = document.getElementById('coursePlayer');
  if (playerSection) {
    playerSection.style.display = 'block';
    setTimeout(() => {
      playerSection.style.opacity = '1';
    }, 50);
  }

  // Populate player fields
  document.getElementById('playerCourseTitle').innerText = course.name;
  document.getElementById('playerInstructor').innerText = course.instructor || 'LearnX Instructor';
  
  const playerVideo = document.getElementById('playerVideo');
  if (playerVideo) {
    playerVideo.poster = course.img || 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500';
  }

  // Customize sample videos based on course name
  let videoUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  ];

  const courseNameLower = course.name.toLowerCase();
  if (courseNameLower.includes('python')) {
    videoUrls = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    ];
  } else if (courseNameLower.includes('javascript') || courseNameLower.includes('js')) {
    videoUrls = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    ];
  } else if (courseNameLower.includes('html') || courseNameLower.includes('css')) {
    videoUrls = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    ];
  }

  // Lectures List with Custom Video Sources
  const lectures = [
    { title: '1. Introduction & Setup', duration: '12 mins', videoUrl: videoUrls[0] },
    { title: '2. Basic Principles & Environment', duration: '25 mins', videoUrl: videoUrls[1] },
    { title: '3. Intermediate Projects', duration: '40 mins', videoUrl: videoUrls[2] },
    { title: '4. Advanced Techniques & Deployment', duration: '35 mins', videoUrl: videoUrls[3] }
  ];

  // Render Syllabus
  const playerSyllabus = document.getElementById('playerSyllabus');
  if (playerSyllabus) {
    playerSyllabus.innerHTML = '';
    lectures.forEach((lec, idx) => {
      const isCompleted = course.progress > (idx * 25);
      const isUnlocked = idx <= Math.floor(course.progress / 25);
      const isActive = idx === activeLectureIndex;
      
      let checkIcon = 'fa-lock text-muted';
      if (isCompleted) {
        checkIcon = 'fa-check-circle text-success';
      } else if (isUnlocked) {
        checkIcon = 'fa-circle text-muted';
      }
      
      const activeClass = isActive ? 'active' : '';

      const lecHtml = `
        <div class="syllabus-item ${activeClass}" data-index="${idx}" style="${!isUnlocked ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
          <i class="far ${checkIcon}"></i>
          <div style="flex:1;">
            <h4 style="font-size:0.95rem; margin-bottom:2px; font-weight:${isActive ? '600' : '400'};">${lec.title}</h4>
            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="far fa-clock"></i> ${lec.duration}</span>
          </div>
        </div>
      `;
      playerSyllabus.innerHTML += lecHtml;
    });

    // Click lecture to view
    document.querySelectorAll('.syllabus-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'));
        
        // Enforce progression lock
        const isUnlocked = idx <= Math.floor(course.progress / 25);
        if (!isUnlocked) {
          Swal.fire({
            title: 'Lecture Locked 🔒',
            text: 'You must pass the quiz for the previous lecture to unlock this lesson.',
            icon: 'warning',
            confirmButtonColor: '#6366f1'
          });
          return;
        }

        document.querySelectorAll('.syllabus-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        activeLectureIndex = idx;
        
        document.getElementById('playerActiveLecture').innerText = `Lecture ${idx+1}: ${lectures[idx].title.split('. ')[1]}`;
        document.getElementById('playerLectureTitle').innerText = lectures[idx].title.split('. ')[1];
        
        // Update video source and play
        if (playerVideo) {
          playerVideo.src = lectures[idx].videoUrl;
          playerVideo.load();
          playerVideo.play().catch(err => console.log("Playback prevented:", err));
        }
        
        // Reset to Overview tab when switching lectures
        switchPlayerTab('overview');
        
        updateCompleteButtonState(course);
      });
    });
  }

  // Set initial video and text
  document.getElementById('playerActiveLecture').innerText = `Lecture ${activeLectureIndex+1}: ${lectures[activeLectureIndex].title.split('. ')[1]}`;
  document.getElementById('playerLectureTitle').innerText = lectures[activeLectureIndex].title.split('. ')[1];
  
  if (playerVideo) {
    playerVideo.src = lectures[activeLectureIndex].videoUrl;
    playerVideo.load();
  }

  // Reset to Overview tab when player first opens
  switchPlayerTab('overview');

  updateCompleteButtonState(course);
}

function updateCompleteButtonState(course) {
  const markBtn = document.getElementById('markCompleteBtn');
  if (markBtn) {
    const isLecCompleted = course.progress > (activeLectureIndex * 25);
    if (isLecCompleted) {
      markBtn.innerText = 'Completed ✓';
      markBtn.disabled = true;
    } else {
      markBtn.innerText = 'Pass Quiz to Complete';
      markBtn.disabled = true;
    }
  }
}

// Close player button
const closePlayerBtn = document.getElementById('closePlayerBtn');
if (closePlayerBtn) {
  closePlayerBtn.addEventListener('click', () => {
    const playerVideo = document.getElementById('playerVideo');
    if (playerVideo) {
      playerVideo.pause();
    }
    document.querySelector('.sidebar ul li[data-section="courses"]').click();
  });
}

// Complete lesson action
const markCompleteBtn = document.getElementById('markCompleteBtn');
if (markCompleteBtn) {
  markCompleteBtn.addEventListener('click', async () => {
    const course = courses.find(c => c.courseId === activeCourseId);
    if (!course) return;

    const nextProgress = (activeLectureIndex + 1) * 25;
    
    markCompleteBtn.disabled = true;
    markCompleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/course/${activeCourseId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress: nextProgress })
      });

      if (response.ok) {
        const resData = await response.json();
        course.progress = nextProgress;
        
        // Update user state and local storage immediately
        if (currentUser) {
          currentUser.xp = resData.xp;
          currentUser.badges = resData.badges;
        }
        profile.xp = resData.xp;
        profile.badges = resData.badges;
        
        // Update header XP value immediately
        const headerXpValue = document.getElementById('headerXpValue');
        if (headerXpValue) {
          headerXpValue.innerText = `${profile.xp} XP`;
        }
        
        // Update learnx_user in localStorage
        const cachedUserStr = localStorage.getItem('learnx_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            cachedUser.xp = profile.xp;
            cachedUser.badges = profile.badges;
            localStorage.setItem('learnx_user', JSON.stringify(cachedUser));
          } catch(e) {
            console.error(e);
          }
        }
        
        // Award XP message trigger
        let xpMsg = "";
        if (resData.earnedXp > 0) {
          xpMsg = ` (+${resData.earnedXp} XP)`;
        }

        // Check for unlocked badges to showcase
        if (resData.unlockedBadges && resData.unlockedBadges.length > 0) {
          resData.unlockedBadges.forEach(badge => {
            Swal.fire({
              title: 'Badge Unlocked! 🏆',
              html: `You have earned the <strong>"${badge.name}"</strong> badge!<br><em>"${badge.description}"</em>`,
              icon: 'success',
              confirmButtonText: 'Great!',
              confirmButtonColor: '#6366f1'
            });
          });
        }

        if (nextProgress === 100) {
          Swal.fire({
            title: 'Congratulations! 🎓' + xpMsg,
            text: `You have successfully completed "${course.name}"! Your completion certificate is now available under the Certificates tab.`,
            icon: 'success',
            confirmButtonText: 'View Certificate',
            confirmButtonColor: '#6366f1'
          }).then((result) => {
            if (result.isConfirmed) {
              document.querySelector('.sidebar ul li[data-section="certificates"]').click();
            }
          });
        } else {
          Swal.fire({
            title: 'Lesson Completed! 🌟' + xpMsg,
            text: 'Keep learning to unlock your completion certificate.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
        
        fetchDashboardData();
        
        setTimeout(() => {
          openCoursePlayer(activeCourseId);
        }, 300);
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to update progress.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        markCompleteBtn.disabled = false;
        markCompleteBtn.innerText = 'Complete Lesson';
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'Connection error.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      markCompleteBtn.disabled = false;
      markCompleteBtn.innerText = 'Complete Lesson';
    }
  });
}

// ================== ✅ CERTIFICATES LOGIC ==================
function loadCertificates() {
  const certList = document.getElementById('certificateList');
  if (!certList) return;
  certList.innerHTML = '';

  const completedCourses = courses.filter(c => c.progress === 100);

  if (completedCourses.length === 0) {
    certList.innerHTML = '<p class="text-muted p-3" style="grid-column: 1/-1; text-align: center;">You have not completed any courses yet. Reach 100% progress to unlock your certificate!</p>';
    return;
  }

  completedCourses.forEach(c => {
    const html = `
      <div class="course-card glass cert-card">
        <div class="cert-card-icon"><i class="fas fa-award"></i></div>
        <h3 style="font-size: 1.15rem; margin-bottom: 5px;">${c.name}</h3>
        <p class="instructor" style="margin-bottom: 15px;"><i class="fas fa-chalkboard-teacher"></i> ${c.instructor || 'LearnX Mentor'}</p>
        <button class="btn-primary view-cert-btn" data-id="${c.courseId}" style="width: 100%; padding: 8px; font-size: 0.9rem;">
          View Certificate
        </button>
      </div>
    `;
    certList.innerHTML += html;
  });

  // Bind view certificate clicks
  document.querySelectorAll('.view-cert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      const course = completedCourses.find(c => c.courseId === courseId);
      if (course) {
        openCertificateModal(course);
      }
    });
  });
}

function openCertificateModal(course) {
  document.getElementById('certStudentName').innerText = profile.name;
  document.getElementById('certCourseName').innerText = course.name;
  
  const completionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('certDate').innerText = completionDate;

  // Show Modal
  document.getElementById('certificateModal').classList.add('active');
}

// Certificate modal close/print buttons
const closeCertModal = document.getElementById('closeCertModal');
if (closeCertModal) {
  closeCertModal.addEventListener('click', () => {
    document.getElementById('certificateModal').classList.remove('active');
  });
}

const printCertBtn = document.getElementById('printCertBtn');
if (printCertBtn) {
  printCertBtn.addEventListener('click', () => {
    window.print();
  });
}

const downloadCertBtn = document.getElementById('downloadCertBtn');
if (downloadCertBtn) {
  downloadCertBtn.addEventListener('click', async () => {
    const element = document.getElementById('printableCertificate');
    if (!element) return;

    const oldBtnText = downloadCertBtn.innerHTML;
    downloadCertBtn.disabled = true;
    downloadCertBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Generating...';

    // Save all original inline styles of children
    const elementsToModify = element.querySelectorAll('*');
    const originalStyles = [];
    const originalParentStyle = element.getAttribute('style');

    try {
      const { jsPDF } = window.jspdf;

      // Force clean landscape layout colors on parent
      element.style.background = '#ffffff';
      element.style.color = '#1f2937';
      element.style.borderColor = '#6366f1';
      element.style.borderStyle = 'double';
      element.style.borderWidth = '6px';
      
      // Temporarily swap all CSS variables with hardcoded light-theme colors in children's styles
      elementsToModify.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        originalStyles.push({ el, styleAttr });
        
        if (styleAttr) {
          let newStyle = styleAttr;
          newStyle = newStyle.replace(/var\(--text-main\)/g, '#1f2937');
          newStyle = newStyle.replace(/var\(--text-muted\)/g, '#4b5563');
          newStyle = newStyle.replace(/var\(--card-border\)/g, '#e5e7eb');
          newStyle = newStyle.replace(/var\(--primary\)/g, '#6366f1');
          newStyle = newStyle.replace(/var\(--card-bg\)/g, '#ffffff');
          el.setAttribute('style', newStyle);
        }
      });
      
      const canvas = await html2canvas(element, {
        scale: 3, // High-res export
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: 0, // Prevent page scroll offset issues
        scrollX: 0
      });

      // Restore original inline styles
      element.setAttribute('style', originalParentStyle);
      originalStyles.forEach(({ el, styleAttr }) => {
        if (styleAttr) {
          el.setAttribute('style', styleAttr);
        } else {
          el.removeAttribute('style');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const xOffset = 10;
      const yOffset = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      
      const courseName = document.getElementById('certCourseName').innerText || 'Course';
      const filename = `LearnX_Certificate_${courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(filename);

      Swal.fire({
        title: 'Success! 📄',
        text: 'Your certificate PDF has been successfully downloaded.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback restore in case of failure
      element.setAttribute('style', originalParentStyle);
      originalStyles.forEach(({ el, styleAttr }) => {
        if (styleAttr) el.setAttribute('style', styleAttr);
        else el.removeAttribute('style');
      });

      Swal.fire({
        title: 'Error',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      downloadCertBtn.disabled = false;
      downloadCertBtn.innerHTML = oldBtnText;
    }
  });
}

// ================== ✅ ASSIGNMENT MODALS LOGIC ==================
const closeAssignmentModal = document.getElementById('closeAssignmentModal');
if (closeAssignmentModal) {
  closeAssignmentModal.addEventListener('click', () => {
    document.getElementById('submitAssignmentModal').classList.remove('active');
  });
}

const submitAssignmentForm = document.getElementById('submitAssignmentForm');
if (submitAssignmentForm) {
  submitAssignmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('submitAssignmentId').value;
    const url = document.getElementById('submitAssignmentUrl').value;
    const notes = document.getElementById('submitAssignmentNotes').value;

    const submitBtn = submitAssignmentForm.querySelector('button[type="submit"]');
    const oldBtnText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/assignment/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ url, notes })
      });
      
      if (response.ok) {
        const resData = await response.json();
        document.getElementById('submitAssignmentModal').classList.remove('active');
        
        // Update user state and local storage immediately
        if (currentUser) {
          currentUser.xp = resData.xp;
          currentUser.badges = resData.badges;
        }
        profile.xp = resData.xp;
        profile.badges = resData.badges;
        
        // Update header XP value immediately
        const headerXpValue = document.getElementById('headerXpValue');
        if (headerXpValue) {
          headerXpValue.innerText = `${profile.xp} XP`;
        }
        
        // Update learnx_user in localStorage
        const cachedUserStr = localStorage.getItem('learnx_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            cachedUser.xp = profile.xp;
            cachedUser.badges = profile.badges;
            localStorage.setItem('learnx_user', JSON.stringify(cachedUser));
          } catch(e) {
            console.error(e);
          }
        }
        
        // Award XP message trigger
        let xpMsg = "";
        if (resData.earnedXp > 0) {
          xpMsg = ` (+${resData.earnedXp} XP)`;
        }

        // Check for unlocked badges to showcase
        if (resData.unlockedBadges && resData.unlockedBadges.length > 0) {
          resData.unlockedBadges.forEach(badge => {
            Swal.fire({
              title: 'Badge Unlocked! 🏆',
              html: `You have earned the <strong>"${badge.name}"</strong> badge!<br><em>"${badge.description}"</em>`,
              icon: 'success',
              confirmButtonText: 'Great!',
              confirmButtonColor: '#6366f1'
            });
          });
        } else {
          Swal.fire({
            title: 'Project Submitted! 🚀' + xpMsg,
            text: 'Your project has been successfully submitted for grading.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        }
        
        fetchDashboardData(); // Refresh data
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to submit assignment.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Server error.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = oldBtnText;
    }
  });
}

// Reset Dashboard Data
const resetBtn = document.getElementById('resetData');
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will reset all your courses progress, assignments, and settings back to default. This cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Yes, reset it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          Swal.fire({
            title: 'Reset Success!',
            text: 'Your dashboard data has been reset to default.',
            icon: 'success',
            confirmButtonColor: '#6366f1'
          });
          fetchDashboardData();
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Failed to reset dashboard data.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          title: 'Error',
          text: 'Connection error.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  });
}

// ================== ✅ LEADERBOARD & ACHIEVEMENTS LOGIC ==================
async function loadLeaderboard() {
  const tableBody = document.getElementById('leaderboardTableBody');
  const badgesGrid = document.getElementById('badgesGrid');
  if (!tableBody || !badgesGrid) return;

  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading rankings...</td></tr>';
  badgesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading achievements...</div>';

  try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/leaderboard?_=${Date.now()}`, {
          headers: {
              "Authorization": `Bearer ${token}`,
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
          }
      });

      if (response.ok) {
          const data = await response.json();

          // 1. Update Personal stats counters
          const rankEl = document.getElementById('leaderboardUserRank');
          const xpEl = document.getElementById('leaderboardUserXp');
          const badgesEl = document.getElementById('leaderboardUserBadges');

          if (rankEl) rankEl.innerText = `#${data.userRank}`;
          if (xpEl) xpEl.innerText = `${data.userXp} XP`;
          if (badgesEl) badgesEl.innerText = data.userBadgesCount;

          // 2. Render Top Students Table
          tableBody.innerHTML = '';
          if (data.leaderboard.length === 0) {
              tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No rankings available yet.</td></tr>';
          } else {
              data.leaderboard.forEach(student => {
                  let rankDisplay = student.rank;
                  if (student.rank === 1) rankDisplay = '<span style="color:#eab308; font-size:1.2rem;"><i class="fas fa-crown"></i></span>';
                  else if (student.rank === 2) rankDisplay = '<span style="color:#94a3b8; font-size:1.1rem;"><i class="fas fa-medal"></i></span>';
                  else if (student.rank === 3) rankDisplay = '<span style="color:#b45309; font-size:1rem;"><i class="fas fa-medal"></i></span>';

                  const avatarUrl = student.dp ? student.dp : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=80`;
                  const isCurrentUser = student.id === currentUser._id;
                  const rowStyle = isCurrentUser ? 'style="background: rgba(99, 102, 241, 0.05); font-weight: 600; border-left: 3px solid var(--primary);"' : '';

                  const html = `
                    <tr ${rowStyle}>
                      <td style="padding: 15px 8px; font-weight:700; text-align:center; width: 60px;">${rankDisplay}</td>
                      <td style="padding: 15px 8px; display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" alt="Avatar" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border: 1.5px solid var(--primary);">
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                          ${student.name} ${isCurrentUser ? '<span style="font-size:0.75rem; background: var(--primary); color:white; padding: 2px 6px; border-radius:10px; margin-left: 5px;">You</span>' : ''}
                        </span>
                      </td>
                      <td style="padding: 15px 8px; text-align: right; font-weight: 700; color: var(--primary);">${student.xp}</td>
                      <td style="padding: 15px 8px; text-align: right; color: var(--text-muted); font-size:0.9rem;">
                        <i class="fas fa-shield-halved" style="color:var(--primary); margin-right:4px;"></i> ${student.badgesCount}
                      </td>
                    </tr>
                  `;
                  tableBody.innerHTML += html;
              });
          }

          // 3. Render Achievements Badges Grid
          badgesGrid.innerHTML = '';
          const badgeDefinitions = [
              { name: "First Steps", icon: "fa-shoe-prints", description: "Completed your first lesson!", color: "#3b82f6" },
              { name: "Project Submitter", icon: "fa-upload", description: "Submitted your first assignment!", color: "#ec4899" },
              { name: "HTML Master", icon: "fa-code", description: "Completed HTML & CSS Masterclass!", color: "#10b981" },
              { name: "JS Wizard", icon: "fa-wand-magic-sparkles", description: "Completed JavaScript Basics!", color: "#8b5cf6" },
              { name: "Active Learner", icon: "fa-fire", description: "Earned over 200 XP!", color: "#ef4444" }
          ];

          badgeDefinitions.forEach(badgeDef => {
              const unlockedBadge = currentUser.badges && currentUser.badges.find(b => b.name === badgeDef.name);
              const isUnlocked = !!unlockedBadge;
              const dateText = isUnlocked ? new Date(unlockedBadge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

              const itemHtml = `
                <div class="badge-item" style="padding: 18px 12px; border-radius: 14px; 
                  background: ${isUnlocked ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.02)'}; 
                  border: 1.5px solid ${isUnlocked ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                  opacity: ${isUnlocked ? '1' : '0.45'}; 
                  transition: all 0.3s ease;
                  box-shadow: ${isUnlocked ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none'};"
                  onmouseover="this.style.transform='translateY(-5px)'"
                  onmouseout="this.style.transform='translateY(0)'">
                  
                  <div style="font-size: 2.4rem; color: ${isUnlocked ? badgeDef.color : '#6b7280'}; margin-bottom: 12px; filter: ${isUnlocked ? 'drop-shadow(0 2px 6px ' + badgeDef.color + '40)' : 'none'};">
                    <i class="fas ${badgeDef.icon}"></i>
                  </div>
                  <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; color: ${isUnlocked ? 'var(--text-main)' : 'var(--text-muted)'}">${badgeDef.name}</h4>
                  <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.25; margin: 0; min-height:36px; display:flex; align-items:center; justify-content:center;">
                    ${badgeDef.description}
                  </p>
                  
                  ${isUnlocked 
                    ? `<span style="display:inline-block; font-size: 0.65rem; color:#10b981; margin-top: 10px; font-weight: 600; background:rgba(16, 185, 129, 0.1); padding:2px 8px; border-radius:10px;"><i class="fas fa-check-circle"></i> Unlocked</span>` 
                    : `<span style="display:inline-block; font-size: 0.65rem; color:var(--text-muted); margin-top: 10px; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:10px;"><i class="fas fa-lock"></i> Locked</span>`
                  }
                  
                  ${isUnlocked && dateText 
                    ? `<div style="font-size: 0.65rem; color:var(--text-muted); margin-top: 6px;">${dateText}</div>` 
                    : ''
                  }
                </div>
              `;
              badgesGrid.innerHTML += itemHtml;
          });
      } else {
          console.error("Failed to fetch leaderboard data.");
          tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Failed to load rankings.</td></tr>';
          badgesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#ef4444;">Failed to load achievements.</div>';
      }
  } catch (error) {
      console.error(error);
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Connection error.</td></tr>';
      badgesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#ef4444;">Connection error.</div>';
  }
}

// ================== ✅ PRACTICE QUIZ LOGIC ==================
const quizBank = {
  c1: [
    // Lecture 1
    [
      {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Text Markup Language", "Hyper Tabular Markup Language", "Hypertech Markup Language"],
        answer: 0
      },
      {
        question: "Which HTML element is used for the largest heading?",
        options: ["<heading>", "<h6>", "<h1>", "<head>"],
        answer: 2
      },
      {
        question: "Which tag is used to link an external CSS file?",
        options: ["<link>", "<style>", "<script>", "<a>"],
        answer: 0
      }
    ],
    // Lecture 2
    [
      {
        question: "What is the correct CSS syntax to change the text color of a paragraph to blue?",
        options: ["p {text-color: blue;}", "p {color: blue;}", "p:color = blue;", "all.p {color: blue;}"],
        answer: 1
      },
      {
        question: "Which property is used to change the background color in CSS?",
        options: ["color", "bgcolor", "background-color", "background-style"],
        answer: 2
      },
      {
        question: "What is the default display value of a <div> element?",
        options: ["inline", "block", "inline-block", "flex"],
        answer: 1
      }
    ],
    // Lecture 3
    [
      {
        question: "In the CSS box model, which of the following is the innermost component?",
        options: ["Padding", "Border", "Margin", "Content"],
        answer: 3
      },
      {
        question: "How do you center a block element horizontally using margin?",
        options: ["margin: center;", "margin: 0 auto;", "margin: auto 0;", "align: center;"],
        answer: 1
      },
      {
        question: "Which CSS property is used to create space inside the border of an element?",
        options: ["margin", "padding", "spacing", "border-width"],
        answer: 1
      }
    ],
    // Lecture 4
    [
      {
        question: "Which Flexbox property controls the alignment of items along the main axis?",
        options: ["align-items", "justify-content", "align-content", "flex-direction"],
        answer: 1
      },
      {
        question: "What does media query '@media (max-width: 600px)' target?",
        options: ["Screens larger than 600px", "Screens exactly 600px wide", "Screens 600px wide or smaller", "Print documents only"],
        answer: 2
      },
      {
        question: "What is the standard port number for secure HTTP (HTTPS)?",
        options: ["80", "8080", "443", "22"],
        answer: 2
      }
    ]
  ],
  c2: [
    // Lecture 1
    [
      {
        question: "Inside which HTML element do we put JavaScript?",
        options: ["<js>", "<scripting>", "<script>", "<javascript>"],
        answer: 2
      },
      {
        question: "How do you write 'Hello World' in an alert box?",
        options: ["msgBox('Hello World');", "alertBox('Hello World');", "alert('Hello World');", "console.log('Hello World');"],
        answer: 2
      },
      {
        question: "Which keyword is used to declare a block-scoped variable that can be reassigned?",
        options: ["var", "let", "const", "def"],
        answer: 1
      }
    ],
    // Lecture 2
    [
      {
        question: "How do you write a conditional statement for executing some code if 'i' is equal to 5?",
        options: ["if i = 5 then", "if (i == 5)", "if i == 5", "if i = 5"],
        answer: 1
      },
      {
        question: "What is the correct way to write a JavaScript array?",
        options: ["const colors = 'red', 'green', 'blue'", "const colors = ['red', 'green', 'blue']", "const colors = (1:'red', 2:'green', 3:'blue')", "const colors = {'red', 'green', 'blue'}"],
        answer: 1
      },
      {
        question: "How do you call a function named 'myFunction'?",
        options: ["call myFunction()", "myFunction()", "call function myFunction()", "myFunction.call()"],
        answer: 1
      }
    ],
    // Lecture 3
    [
      {
        question: "How do you find the number with the highest value of x and y?",
        options: ["Math.max(x, y)", "Math.ceil(x, y)", "Math.high(x, y)", "top(x, y)"],
        answer: 0
      },
      {
        question: "How do you add a click event listener to an element with ID 'btn'?",
        options: ["btn.onclick = addEventListener('click', ...)", "btn.addEventListener('click', myFunction)", "btn.listen('click', ...)", "btn.on('click', ...)"],
        answer: 1
      },
      {
        question: "Which array method adds a new element to the end of an array?",
        options: ["pop()", "push()", "shift()", "unshift()"],
        answer: 1
      }
    ],
    // Lecture 4
    [
      {
        question: "What is the value of 'this' inside an arrow function?",
        options: ["The global object", "The element that triggered the event", "It is lexically bound to the surrounding context", "undefined"],
        answer: 2
      },
      {
        question: "What is a Promise in JavaScript?",
        options: ["A guarantee that code has no syntax errors", "An object representing the eventual completion or failure of an asynchronous operation", "A secure encryption key", "A standard function declaration style"],
        answer: 1
      },
      {
        question: "Which method is used to parse a JSON string into a JavaScript object?",
        options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.objectify()"],
        answer: 1
      }
    ]
  ],
  fallback: [
    // Lecture 1
    [
      {
        question: "What is the primary purpose of version control systems like Git?",
        options: ["To design user interfaces", "To run databases", "To track changes in source code over time", "To host live websites"],
        answer: 2
      },
      {
        question: "Which command initializes a new Git repository?",
        options: ["git start", "git init", "git new", "git create"],
        answer: 1
      },
      {
        question: "What is the default branch name created when initializing a new Git repository?",
        options: ["master or main", "trunk", "root", "develop"],
        answer: 0
      }
    ],
    // Lecture 2
    [
      {
        question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
        options: ["Queue", "Stack", "Array", "Hash map"],
        answer: 1
      },
      {
        question: "What does API stand for?",
        options: ["Application Programming Interface", "App Program Integration", "Applied Protocol Internet", "Advanced Programming Interface"],
        answer: 0
      },
      {
        question: "What is the purpose of the HTTP GET method?",
        options: ["To submit data to a resource", "To delete a resource", "To request/retrieve data from a specified resource", "To update a resource"],
        answer: 2
      }
    ],
    // Lecture 3
    [
      {
        question: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
        answer: 2
      },
      {
        question: "Which of the following is NOT a relational database?",
        options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"],
        answer: 2
      },
      {
        question: "What does SQL stand for?",
        options: ["Structured Query Language", "Simple Query Language", "Standard Query List", "System Query Language"],
        answer: 0
      }
    ],
    // Lecture 4
    [
      {
        question: "What is the main benefit of containerization using Docker?",
        options: ["Faster internet speeds", "Guaranteeing consistency of environment across dev, testing, and production", "Automatic code generation", "Database compression"],
        answer: 1
      },
      {
        question: "What is CI/CD in modern software development?",
        options: ["Customer Integration / Customer Delivery", "Code Inspection / Code Development", "Continuous Integration / Continuous Deployment", "Critical Infrastructure / Cloud Deployment"],
        answer: 2
      },
      {
        question: "Which HTTP status code represents 'Internal Server Error'?",
        options: ["400", "404", "500", "403"],
        answer: 2
      }
    ]
  ]
};

function getQuizQuestions(courseId, lectureIdx) {
  if (!courseId) return quizBank.fallback[0];
  const cid = courseId.toLowerCase();
  
  let courseQuiz = quizBank.fallback;
  if (cid === 'c1' || cid.includes('web-dev') || cid.includes('html') || cid.includes('css')) {
    courseQuiz = quizBank.c1;
  } else if (cid === 'c2' || cid.includes('javascript') || cid.includes('js')) {
    courseQuiz = quizBank.c2;
  }
  
  return courseQuiz[lectureIdx] || courseQuiz[0] || quizBank.fallback[0];
}

function switchPlayerTab(tabName) {
  const tabOverviewBtn = document.getElementById('tabOverviewBtn');
  const tabQuizBtn = document.getElementById('tabQuizBtn');
  const panelOverview = document.getElementById('panelOverview');
  const panelQuiz = document.getElementById('panelQuiz');

  if (!tabOverviewBtn || !tabQuizBtn || !panelOverview || !panelQuiz) return;

  if (tabName === 'overview') {
    tabOverviewBtn.classList.add('active');
    tabOverviewBtn.style.color = 'var(--primary)';
    tabOverviewBtn.style.borderBottom = '2px solid var(--primary)';
    
    tabQuizBtn.classList.remove('active');
    tabQuizBtn.style.color = 'var(--text-muted)';
    tabQuizBtn.style.borderBottom = '2px solid transparent';
    
    panelOverview.style.display = 'block';
    panelQuiz.style.display = 'none';
  } else if (tabName === 'quiz') {
    tabQuizBtn.classList.add('active');
    tabQuizBtn.style.color = 'var(--primary)';
    tabQuizBtn.style.borderBottom = '2px solid var(--primary)';
    
    tabOverviewBtn.classList.remove('active');
    tabOverviewBtn.style.color = 'var(--text-muted)';
    tabOverviewBtn.style.borderBottom = '2px solid transparent';
    
    panelOverview.style.display = 'none';
    panelQuiz.style.display = 'block';
    
    renderQuiz();
  }
}

function renderQuiz(forceRetake = false) {
  const quizContent = document.getElementById('quizContent');
  if (!quizContent) return;

  const course = courses.find(c => c.courseId === activeCourseId);
  if (!course) {
    quizContent.innerHTML = '<p class="text-muted text-center p-4">No course loaded.</p>';
    return;
  }

  const questions = getQuizQuestions(activeCourseId, activeLectureIndex);
  const isCompleted = course.progress > (activeLectureIndex * 25);

  // If completed and not forcing a retake, show the passed state
  if (isCompleted && !forceRetake) {
    let quizHtml = `
      <div style="text-align: center; padding: 30px 20px; border-radius: 12px; background: rgba(16, 185, 129, 0.05); border: 1.5px solid rgba(16, 185, 129, 0.2); margin-bottom: 25px;">
        <div style="font-size: 3.5rem; color: #10b981; margin-bottom: 15px; filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.3));">
          <i class="fas fa-certificate"></i>
        </div>
        <h3 style="font-size: 1.4rem; font-weight: 700; color: #10b981; margin-bottom: 8px;">Quiz Completed Successfully!</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">You scored 100% (3/3) and unlocked the next lesson.</p>
        <button id="retakeQuizBtn" class="btn-primary" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 20px; font-size: 0.9rem; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.2)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'">
          <i class="fas fa-redo" style="margin-right: 6px;"></i> Retake Practice Quiz
        </button>
      </div>
      <div style="border-top: 1px dashed var(--card-border); padding-top: 20px;">
        <h4 style="font-size: 1.1rem; margin-bottom: 15px; color: var(--text-main);"><i class="fas fa-clipboard-check" style="margin-right: 8px; color: #10b981;"></i> Quiz Answers Review</h4>
    `;

    questions.forEach((q, qIdx) => {
      quizHtml += `
        <div style="margin-bottom: 20px; padding: 15px; border-radius: 10px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--card-border);">
          <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 12px; color: var(--text-main);">${qIdx + 1}. ${q.question}</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
      `;

      q.options.forEach((opt, oIdx) => {
        const isCorrect = oIdx === q.answer;
        let borderStyle = 'border: 1px solid var(--card-border);';
        let bgStyle = 'background: rgba(255, 255, 255, 0.01);';
        let iconHtml = '<i class="far fa-circle" style="color: var(--text-muted);"></i>';

        if (isCorrect) {
          borderStyle = 'border: 1.5px solid #10b981;';
          bgStyle = 'background: rgba(16, 185, 129, 0.08);';
          iconHtml = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
        }

        quizHtml += `
            <div style="padding: 10px 12px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: ${isCorrect ? 'var(--text-main)' : 'var(--text-muted)'}; ${borderStyle} ${bgStyle}">
              ${iconHtml}
              <span>${opt}</span>
            </div>
        `;
      });

      quizHtml += `
          </div>
        </div>
      `;
    });

    quizHtml += `</div>`;
    quizContent.innerHTML = quizHtml;

    // Bind retake button
    const retakeBtn = document.getElementById('retakeQuizBtn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        renderQuiz(true);
      });
    }
    return;
  }

  // Else, render the interactive quiz
  let quizHtml = `
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 5px; color: var(--text-main);">Practice Quiz</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Answer all questions correctly (3/3) to unlock the next lecture and update your progress.</p>
    </div>
    <form id="quizForm" onsubmit="event.preventDefault();">
  `;

  questions.forEach((q, qIdx) => {
    quizHtml += `
      <div style="margin-bottom: 25px; padding: 20px; border-radius: 12px; background: rgba(255, 255, 255, 0.02); border: 1.5px solid var(--card-border);" class="quiz-question-card">
        <p style="font-weight: 600; font-size: 1rem; margin-bottom: 15px; color: var(--text-main);">${qIdx + 1}. ${q.question}</p>
        <div style="display: flex; flex-direction: column; gap: 10px;" class="options-group" data-qidx="${qIdx}">
    `;

    q.options.forEach((opt, oIdx) => {
      quizHtml += `
          <label style="padding: 12px 15px; border-radius: 8px; border: 1px solid var(--card-border); background: rgba(255, 255, 255, 0.01); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s ease; margin: 0; user-select: none;" class="quiz-option-label"
                 onmouseover="if(!this.querySelector('input').checked) { this.style.background='rgba(99, 102, 241, 0.03)'; this.style.borderColor='rgba(99, 102, 241, 0.4)'; }"
                 onmouseout="if(!this.querySelector('input').checked) { this.style.background='rgba(255, 255, 255, 0.01)'; this.style.borderColor='var(--card-border)'; }">
            <input type="radio" name="q_${qIdx}" value="${oIdx}" style="accent-color: var(--primary); width: 18px; height: 18px; cursor: pointer;" required>
            <span style="font-size: 0.9rem; color: var(--text-main); font-family: 'Outfit', sans-serif;">${opt}</span>
          </label>
      `;
    });

    quizHtml += `
        </div>
      </div>
    `;
  });

  quizHtml += `
      <button type="submit" class="btn-primary" style="padding: 12px 24px; font-size: 1rem; width: 100%; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
        <i class="fas fa-paper-plane"></i> Submit Answers
      </button>
    </form>
  `;

  quizContent.innerHTML = quizHtml;

  // Implement interactive option selection visual style updates
  const form = document.getElementById('quizForm');
  if (form) {
    const optionLabels = form.querySelectorAll('.quiz-option-label');
    optionLabels.forEach(label => {
      const input = label.querySelector('input');
      
      // Handle option click visual highlight
      label.addEventListener('click', () => {
        const qIdx = label.parentElement.getAttribute('data-qidx');
        const siblingLabels = form.querySelectorAll(`.options-group[data-qidx="${qIdx}"] .quiz-option-label`);
        
        siblingLabels.forEach(sib => {
          sib.style.background = 'rgba(255, 255, 255, 0.01)';
          sib.style.borderColor = 'var(--card-border)';
          sib.style.boxShadow = 'none';
          const span = sib.querySelector('span');
          if (span) span.style.fontWeight = '400';
        });

        label.style.background = 'rgba(99, 102, 241, 0.08)';
        label.style.borderColor = 'var(--primary)';
        label.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.15)';
        const span = label.querySelector('span');
        if (span) span.style.fontWeight = '600';
      });
    });

    // Handle quiz form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const answers = [];
      let allAnswered = true;

      for (let i = 0; i < questions.length; i++) {
        const selected = form.querySelector(`input[name="q_${i}"]:checked`);
        if (!selected) {
          allAnswered = false;
          break;
        }
        answers.push(parseInt(selected.value));
      }

      if (!allAnswered || answers.length < questions.length) {
        Swal.fire({
          title: 'Unanswered Questions',
          text: 'Please answer all questions before submitting!',
          icon: 'warning',
          confirmButtonColor: '#6366f1'
        });
        return;
      }

      // Grade the quiz
      let correctCount = 0;
      answers.forEach((ans, idx) => {
        if (ans === questions[idx].answer) {
          correctCount++;
        }
      });

      if (correctCount === questions.length) {
        // Passed!
        if (isCompleted) {
          Swal.fire({
            title: 'Quiz Passed! 🎉',
            text: 'You answered all questions correctly (3/3) again! Nice job.',
            icon: 'success',
            confirmButtonColor: '#6366f1'
          }).then(() => {
            renderQuiz();
          });
        } else {
          // Trigger backend update
          await handleQuizPassedSuccess();
        }
      } else {
        // Failed
        Swal.fire({
          title: 'Incorrect Answers ❌',
          text: `You scored ${correctCount}/${questions.length}. Please try again! Watch the video lecture carefully to find the correct answers.`,
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }
}

async function handleQuizPassedSuccess() {
  const course = courses.find(c => c.courseId === activeCourseId);
  if (!course) return;

  const nextProgress = (activeLectureIndex + 1) * 25;
  
  Swal.fire({
    title: 'Grading Quiz...',
    html: 'Verifying your answers and saving progress...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/course/${activeCourseId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ progress: nextProgress })
    });

    if (response.ok) {
      const resData = await response.json();
      course.progress = nextProgress;
      
      // Update user state and local storage immediately
      if (currentUser) {
        currentUser.xp = resData.xp;
        currentUser.badges = resData.badges;
      }
      profile.xp = resData.xp;
      profile.badges = resData.badges;
      
      // Update header XP value immediately
      const headerXpValue = document.getElementById('headerXpValue');
      if (headerXpValue) {
        headerXpValue.innerText = `${profile.xp} XP`;
      }
      
      // Update learnx_user in localStorage
      const cachedUserStr = localStorage.getItem('learnx_user');
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          cachedUser.xp = profile.xp;
          cachedUser.badges = profile.badges;
          localStorage.setItem('learnx_user', JSON.stringify(cachedUser));
        } catch(e) {
          console.error(e);
        }
      }
      
      let xpMsg = "";
      if (resData.earnedXp > 0) {
        xpMsg = ` (+${resData.earnedXp} XP)`;
      }

      // Check for unlocked badges to showcase
      if (resData.unlockedBadges && resData.unlockedBadges.length > 0) {
        resData.unlockedBadges.forEach(badge => {
          Swal.fire({
            title: 'Badge Unlocked! 🏆',
            html: `You have earned the <strong>"${badge.name}"</strong> badge!<br><em>"${badge.description}"</em>`,
            icon: 'success',
            confirmButtonText: 'Great!',
            confirmButtonColor: '#6366f1'
          });
        });
      }

      if (nextProgress === 100) {
        Swal.fire({
          title: 'Congratulations! 🎓' + xpMsg,
          text: `You have successfully completed "${course.name}"! Your completion certificate is now available under the Certificates tab.`,
          icon: 'success',
          confirmButtonText: 'View Certificate',
          confirmButtonColor: '#6366f1'
        }).then((result) => {
          if (result.isConfirmed) {
            document.querySelector('.sidebar ul li[data-section="certificates"]').click();
          }
        });
      } else {
        Swal.fire({
          title: 'Quiz Passed! 🌟' + xpMsg,
          text: 'Perfect score! Next lesson is now unlocked.',
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
      }
      
      fetchDashboardData();
      
      setTimeout(() => {
        openCoursePlayer(activeCourseId);
      }, 300);
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update progress.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: 'Error',
      text: 'Connection error.',
      icon: 'error',
      confirmButtonColor: '#ef4444'
    });
  }
}

// Bind player tab click listeners once the DOM loads
const tabOverviewBtn = document.getElementById('tabOverviewBtn');
const tabQuizBtn = document.getElementById('tabQuizBtn');

if (tabOverviewBtn && tabQuizBtn) {
  tabOverviewBtn.addEventListener('click', () => switchPlayerTab('overview'));
  tabQuizBtn.addEventListener('click', () => switchPlayerTab('quiz'));
}

