// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {

  // --------- CATEGORY FILTER BUTTONS ----------
  const filterButtons = document.querySelectorAll(".filter-btn");
  const categoryGroups = document.querySelectorAll(".category-group");
  const searchInput = document.querySelector(".category-search input");

  const filterCategories = (category = "", query = "") => {
    categoryGroups.forEach(group => {
      const groupTitle = group.querySelector(".category-header h2").textContent.toLowerCase();
      const items = group.querySelectorAll(".category-item");
      let showGroup = false;

      items.forEach(item => {
        const titleEl = item.querySelector("h3");
        if (!titleEl) return;
        const title = titleEl.textContent.toLowerCase();
        // Show item if it matches search query
        if (title.includes(query)) {
          item.style.display = "flex";
          showGroup = true;
        } else {
          item.style.display = "none";
        }
      });

      // Show group if it matches category filter AND has at least one visible item
      if ((category === "all categories" || groupTitle.includes(category)) && showGroup) {
        group.parentElement.style.display = "block";
      } else {
        group.parentElement.style.display = "none";
      }
    });
  };

  // Filter button click
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.textContent.trim().toLowerCase();
      const query = searchInput.value.toLowerCase();
      filterCategories(category, query);
    });
  });

  // Search input
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const activeCategoryBtn = document.querySelector(".filter-btn.active");
    const category = activeCategoryBtn ? activeCategoryBtn.textContent.toLowerCase() : "all categories";

    filterCategories(category, query);
  });

  // --------- STATS COUNTER ----------
  const stats = document.querySelectorAll(".stat-card h3");
  stats.forEach(stat => {
    let target = parseInt(stat.textContent.replace(/\D/g, "")); // extract number
    let count = 0;
    const increment = Math.ceil(target / 100);

    const counter = setInterval(() => {
      count += increment;
      if(count >= target) count = target;

      if(stat.textContent.includes("K")){
        stat.textContent = count + "K+";
      } else {
        stat.textContent = count + "+";
      }

      if(count >= target) clearInterval(counter);
    }, 20);
  });

});


// Initialize modal
const fsModal = new bootstrap.Modal(document.getElementById('roadmapModal'));

function renderFSRoadmap(title, roadmap) {
  document.getElementById("modalTitle").innerText = title;
  const container = document.getElementById("roadmapContainer");
  container.innerHTML = "";

  roadmap.forEach((stepObj, index) => {
    const stepDiv = document.createElement("div");
    stepDiv.classList.add("roadmap-step", "p-3", "border", "rounded", "bg-light", "mb-3");

    const coursesList = stepObj.courses.map(course => `<li>${course}</li>`).join("");

    stepDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Step ${index + 1}: ${stepObj.step}</strong>
        <span class="text-muted">${stepObj.duration}</span>
      </div>
      <ul>${coursesList}</ul>
    `;

    container.appendChild(stepDiv);
  });

  fsModal.show();
}

document.querySelectorAll(".view-path-btn-fs").forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const title = button.getAttribute("data-title");
    const roadmap = JSON.parse(button.getAttribute("data-roadmap"));
    renderFSRoadmap(title, roadmap);
  });
});


//
const dsModal = new bootstrap.Modal(document.getElementById('roadmapModal'));

function renderDSRoadmap(title, roadmap) {
  document.getElementById("modalTitle").innerText = title;
  const container = document.getElementById("roadmapContainer");
  container.innerHTML = "";

  roadmap.forEach((stepObj, index) => {
    const stepDiv = document.createElement("div");
    stepDiv.classList.add("roadmap-step", "p-3", "border", "rounded", "bg-light", "mb-3");

    const coursesList = stepObj.courses.map(course => `<li>${course}</li>`).join("");

    stepDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Step ${index + 1}: ${stepObj.step}</strong>
        <span class="text-muted">${stepObj.duration}</span>
      </div>
      <ul>${coursesList}</ul>
    `;

    container.appendChild(stepDiv);
  });

  dsModal.show();
}

document.querySelectorAll(".view-path-btn-ds").forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const title = button.getAttribute("data-title");
    const roadmap = JSON.parse(button.getAttribute("data-roadmap"));
    renderDSRoadmap(title, roadmap);
  });
});

// 
const uxModal = new bootstrap.Modal(document.getElementById('roadmapModal'));

function renderUXRoadmap(title, roadmap) {
  document.getElementById("modalTitle").innerText = title;
  const container = document.getElementById("roadmapContainer");
  container.innerHTML = "";

  roadmap.forEach((stepObj, index) => {
    const stepDiv = document.createElement("div");
    stepDiv.classList.add("roadmap-step", "p-3", "border", "rounded", "bg-light", "mb-3");

    const coursesList = stepObj.courses.map(course => `<li>${course}</li>`).join("");

    stepDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Step ${index + 1}: ${stepObj.step}</strong>
        <span class="text-muted">${stepObj.duration}</span>
      </div>
      <ul>${coursesList}</ul>
    `;

    container.appendChild(stepDiv);
  });

  uxModal.show();
}

document.querySelectorAll(".view-path-btn-ux").forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const title = button.getAttribute("data-title");
    const roadmap = JSON.parse(button.getAttribute("data-roadmap"));
    renderUXRoadmap(title, roadmap);
  });
});
