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
          joined: cachedUser.joined || 'N/A'
        };
        
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
            assignments = currentUser.assignments || [];
            profile = {
                name: currentUser.name,
                email: currentUser.email,
                studentId: currentUser.studentId || 'N/A',
                dp: currentUser.dp || null,
                joined: new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            };
            
            // Sync with local storage
            localStorage.setItem("learnx_user", JSON.stringify({
                id: currentUser._id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone,
                education: currentUser.education,
                studentId: profile.studentId,
                dp: profile.dp,
                joined: profile.joined
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
    if(dashboardCourseList && index < 2) dashboardCourseList.innerHTML += html;
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
      const isActive = idx === activeLectureIndex;
      
      const checkIcon = isCompleted ? 'fa-check-circle text-success' : 'fa-circle text-muted';
      const activeClass = isActive ? 'active' : '';

      const lecHtml = `
        <div class="syllabus-item ${activeClass}" data-index="${idx}">
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
      markBtn.innerText = 'Complete Lesson';
      markBtn.disabled = false;
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
        course.progress = nextProgress;
        
        if (nextProgress === 100) {
          Swal.fire({
            title: 'Congratulations! 🎓',
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
            title: 'Lesson Completed! 🌟',
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
        document.getElementById('submitAssignmentModal').classList.remove('active');
        Swal.fire({
          title: 'Project Submitted! 🚀',
          text: 'Your project has been successfully submitted for grading.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
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
