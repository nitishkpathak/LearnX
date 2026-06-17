const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://learnx-backend-wygd.onrender.com';

// Check auth
const token = localStorage.getItem('learnx_token');
if (!token) {
    alert('Please sign up or log in to access the dashboard.');
    window.location.href = "index.html?show=signup";
}

// Global user state
let currentUser = null;
let courses = [];
let assignments = [];
let profile = {};

// Sidebar toggle
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
menuBtn.addEventListener('click', () => sidebar.classList.toggle('show'));

// Navigation
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.sidebar ul li[data-section]');

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
    
    const targetSection = document.getElementById(target);
    if(targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
        targetSection.style.opacity = '1';
        targetSection.style.transition = 'opacity 0.3s ease';
        }, 50);
    }

    if (window.innerWidth <= 992) sidebar.classList.remove('show');
  });
});

// Logout
document.getElementById('logout').addEventListener('click', () => {
  if(confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('learnx_auth');
    localStorage.removeItem('learnx_user');
    localStorage.removeItem('learnx_token');
    window.location.href = "index.html";
  }
});

// Load Dashboard Data from API
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/data`, {
            headers: {
                "Authorization": `Bearer ${token}`
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
            
            renderDynamicContent();
            setupSettings(currentUser.settings);
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
          <button class="btn-primary" style="margin-top: 15px; padding: 10px; width: 100%; font-size: 0.95rem;">
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
      btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          await submitAssignment(id);
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
            alert("Assignment Submitted successfully!");
            fetchDashboardData(); // Refresh data
        }
    } catch(err) {
        console.error(err);
        alert("Failed to submit assignment.");
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
      dpBase64 = await toBase64(dpInput.files[0]);
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
            alert("Profile Updated!");
            modal.classList.remove('active');
            fetchDashboardData();
        } else {
            alert("Failed to update profile.");
        }
    } catch(err) {
        console.error(err);
    }
  });
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Settings Logic
function setupSettings(settings) {
    if(!settings) return;

    const emailToggle = document.getElementById('emailNotifToggle');
    const pushToggle = document.getElementById('pushNotifToggle');
    const settingsThemeToggle = document.getElementById('settingsThemeToggle');

    if (emailToggle) {
        emailToggle.checked = settings.emailNotif;
        emailToggle.onchange = (e) => updateSettings({ emailNotif: e.target.checked });
    }

    if (pushToggle) {
        pushToggle.checked = settings.pushNotif;
        pushToggle.onchange = (e) => updateSettings({ pushNotif: e.target.checked });
    }

    if(settingsThemeToggle) {
        settingsThemeToggle.checked = settings.theme === 'dark';
        
        // Sync body theme
        if(settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        settingsThemeToggle.onchange = (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            if(e.target.checked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
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

// Initialize
fetchDashboardData();
