// Global variables
let currentUser = null;
let authToken = null;
let applications = [];
let statusChart = null;
const API_BASE_URL = "http://13.201.26.101";

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
});

// Check authentication and initialize
async function initializeDashboard() {
  if (window.location.pathname.endsWith("index.html")) {
    return; // Prevent redirect loop if already on index.html
  }

  authToken = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");

  if (!authToken || !userData) {
    window.location.href = "index.html";
    return;
  }

  try {
    currentUser = JSON.parse(userData);
    await loadDashboardData();
  } catch (error) {
    console.error("Dashboard initialization error:", error);
    showErrorMessage("Failed to initialize dashboard. Redirecting to login.");
    setTimeout(() => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    }, 2000);
  }
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    await loadJobApplications();
    updateStats();
    updateRecentApplications();
    renderStatusChart();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showErrorMessage("Failed to load dashboard data. Please try again.");
  }
}

// Load job applications using Axios
async function loadJobApplications() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/job-applications`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      applications = response.data;
    } else if (response.status === 401) {
      throw new Error("Unauthorized");
    } else {
      throw new Error(`Failed to load applications: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error loading applications:", error);
    if (
      error.message === "Unauthorized" ||
      (error.response && error.response.status === 401)
    ) {
      showErrorMessage("Session expired. Please log in again.");
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      }, 2000);
    } else {
      showErrorMessage(
        "Unable to load job applications. Please try again later."
      );
    }
    throw error;
  }
}

// Add new application
async function submitNewApplication(e) {
  e.preventDefault();
  const formMessage = document.getElementById("formMessage");
  const submitBtn = document.querySelector("#addApplicationModal .btn-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  formMessage.style.display = "none";

  const companyName = document.getElementById("companyName").value.trim();
  const jobTitle = document.getElementById("jobTitle").value.trim();
  const applicationDate = document.getElementById("applicationDate").value;
  const status = document.getElementById("status").value;
  const notes = document.getElementById("notes").value.trim();
  const resumeFile = document.getElementById("resumePath").files[0];
  const coverLetterFile = document.getElementById("coverLetterPath").files[0];

  if (!companyName || !jobTitle || !applicationDate || !status) {
    formMessage.textContent = "Please fill in all required fields.";
    formMessage.className = "error-message";
    formMessage.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    return;
  }

  try {
    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("jobTitle", jobTitle);
    formData.append("applicationDate", applicationDate);
    formData.append("status", status);
    formData.append("notes", notes);

    if (resumeFile) {
      formData.append("resume", resumeFile);
    }
    if (coverLetterFile) {
      formData.append("coverLetter", coverLetterFile);
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/job-applications`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 201 || response.status === 200) {
      showSuccessMessage("Application added successfully!");
      closeAddApplicationModal();
      await loadDashboardData();
    } else {
      formMessage.textContent = "Failed to add application.";
      formMessage.className = "error-message";
      formMessage.style.display = "block";
    }
  } catch (error) {
    console.error("Error adding application:", error);
    formMessage.textContent = "Error saving application. Try again.";
    formMessage.className = "error-message";
    formMessage.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

// Modal functions for application
function openAddApplicationModal() {
  const modal = document.getElementById("addApplicationModal");
  modal.style.display = "flex";
  document.getElementById("formMessage").style.display = "none";
  document.getElementById("jobTitle").focus();
  document.body.style.overflow = "hidden";
  document
    .getElementById("applicationForm")
    .addEventListener("submit", submitNewApplication);
}

function closeAddApplicationModal() {
  const modal = document.getElementById("addApplicationModal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
  document.getElementById("applicationForm").reset();
  document.getElementById("formMessage").style.display = "none";
  document
    .getElementById("applicationForm")
    .removeEventListener("submit", submitNewApplication);
}

// Modal functions for company
function openAddCompanyModal() {
  const modal = document.getElementById("addCompanyModal");
  modal.style.display = "flex";
  document.getElementById("companyNameInput").focus();
  document.body.style.overflow = "hidden";
}

function closeAddCompanyModal() {
  const modal = document.getElementById("addCompanyModal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
  document.getElementById("companyNameInput").value = "";
  document.getElementById("industry").value = "";
  document.getElementById("size").value = "";
  document.getElementById("contactInfo").value = "";
  document.getElementById("companyNotes").value = "";
}

// Add new company
async function submitNewCompany() {
  const name = document.getElementById("companyNameInput").value;
  const industry = document.getElementById("industry").value;
  const size = document.getElementById("size").value;
  const contactInfo = document.getElementById("contactInfo").value;
  const notes = document.getElementById("companyNotes").value;

  if (!name) {
    showErrorMessage("Please fill in the company name.");
    return;
  }

  try {
    const formData = {
      name,
      industry: industry || "",
      size: size || "",
      contactInfo: contactInfo || "",
      notes: notes || "",
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/companies`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201 || response.status === 200) {
      showSuccessMessage("Company added successfully!");
      closeAddCompanyModal();
    } else {
      throw new Error(`Failed to add company: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error adding company:", error);
    if (error.response && error.response.status === 401) {
      showErrorMessage("Session expired. Please log in again.");
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      }, 2000);
    } else {
      showErrorMessage("Failed to add company. Please try again.");
    }
  }
}

// Update statistics cards
function updateStats() {
  const stats = calculateStats();
  document.getElementById("totalApplications").textContent = stats.total;
  document.getElementById("interviewCount").textContent = stats.interview;
  document.getElementById("offerCount").textContent = stats.offer;
  document.getElementById("rejectedCount").textContent = stats.rejected;
  document.getElementById("acceptedCount").textContent = stats.accepted;
}

// Calculate statistics from applications
function calculateStats() {
  const stats = {
    total: applications.length,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    accepted: 0,
  };

  applications.forEach((app) => {
    const status = app.status.toLowerCase();
    if (status === "interviewed") {
      stats.interview++;
    } else if (status === "offered") {
      stats.offer++;
    } else if (status === "rejected") {
      stats.rejected++;
    } else if (status === "accepted") {
      stats.accepted++;
    } else {
      stats.applied++;
    }
  });

  return stats;
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Update recent applications list
function updateRecentApplications() {
  const recentList = document.getElementById("recentApplicationsList");

  if (applications.length === 0) {
    recentList.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-briefcase"></i>
                        <h3>No Applications Yet</h3>
                        <p>Start by adding your first job application!</p>
                    </div>
                `;
    return;
  }

  const recentApps = applications
    .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate))
    .slice(0, 5);

  recentList.innerHTML = recentApps
    .map(
      (app) => `
                <div class="application-item">
                    <div class="application-info">
                        <h4>${sanitizeHTML(app.jobTitle)}</h4>
                        <p>${sanitizeHTML(app.companyName)} • ${formatDate(
        app.applicationDate
      )}</p>
                    </div>
                    <span class="status-badge status-${sanitizeHTML(app.status)
                      .toLowerCase()
                      .replace(/\s+/g, "")}">${sanitizeHTML(app.status)}</span>
                </div>
            `
    )
    .join("");
}

// Render status chart
function renderStatusChart() {
  const ctx = document.getElementById("statusChart").getContext("2d");
  const stats = calculateStats();

  if (stats.total === 0) {
    document.getElementById("statusChart").parentElement.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-chart-pie"></i>
                        <h3>No Data Available</h3>
                        <p>Add job applications to see the status overview.</p>
                    </div>
                `;
    return;
  }

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Applied", "Interviewed", "Offered", "Rejected", "Accepted"],
      datasets: [
        {
          data: [
            stats.applied,
            stats.interview,
            stats.offer,
            stats.rejected,
            stats.accepted,
          ],
          backgroundColor: [
            "#3498db",
            "#f39c12",
            "#27ae60",
            "#e74c3c",
            "#8e44ad",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
      },
      cutout: "60%",
    },
  });
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Mobile menu toggle
function toggleMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const toggleButton = document.querySelector(".mobile-menu-toggle");
  const isExpanded = navLinks.classList.toggle("show");
  toggleButton.setAttribute("aria-expanded", isExpanded);
}

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
});

// Show error message
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.querySelector(".main-content").prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccessMessage(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document.querySelector(".main-content").prepend(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
}

// Refresh dashboard data
function refreshDashboard() {
  loadDashboardData();
}

// Auto-refresh every 5 minutes
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(refreshDashboard, 300000);
}
function stopAutoRefresh() {
  clearInterval(refreshInterval);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});
startAutoRefresh();

// Debounce resize events for Chart.js
function debounce(fn, ms) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}
window.addEventListener(
  "resize",
  debounce(() => {
    if (statusChart) {
      statusChart.resize();
    }
  }, 100)
);