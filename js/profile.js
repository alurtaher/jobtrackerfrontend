// Navbar toggle
function toggleMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const toggleBtn = document.querySelector(".mobile-menu-toggle");
  const expanded = navLinks.classList.toggle("show");
  toggleBtn.setAttribute("aria-expanded", expanded);
}

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
});

const API_BASE_URL = "http://13.201.26.101";

const alertMessage = document.getElementById("alertMessage");
const loadingDiv = document.getElementById("loading");
const profileForm = document.getElementById("profileForm");
const emailField = document.getElementById("email");
const nameField = document.getElementById("name");
const careerField = document.getElementById("careerGoals");
const createdAtField = document.getElementById("createdAt");
const updatedAtField = document.getElementById("updatedAt");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Show alert message (type: success or error)
function showAlert(text, type = "success") {
  alertMessage.textContent = text;
  alertMessage.className =
    type === "success" ? "success-message" : "error-message";
  alertMessage.style.display = "block";
  setTimeout(() => {
    alertMessage.style.display = "none";
  }, 3500);
}

// Enable edit mode
function enterEditMode() {
  nameField.disabled = false;
  careerField.disabled = false;
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
  cancelBtn.style.display = "inline-block";
}

// Disable edit mode
function exitEditMode() {
  nameField.disabled = true;
  careerField.disabled = true;
  editBtn.style.display = "inline-block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
}

let originalData = {};

// Load user profile
async function loadProfile() {
  alertMessage.style.display = "none";
  profileForm.style.display = "none";
  loadingDiv.style.display = "block";

  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    originalData = data;

    emailField.value = data.email || "";
    nameField.value = data.name || "";
    careerField.value = data.careerGoals || "";
    createdAtField.value = new Date(data.createdAt).toLocaleDateString();
    updatedAtField.value = new Date(data.updatedAt).toLocaleString();

    loadingDiv.style.display = "none";
    profileForm.style.display = "block";
    exitEditMode();
  } catch (err) {
    loadingDiv.style.display = "none";
    showAlert("Failed to load profile. Please try again.", "error");
    if (err.response?.status === 401) {
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      }, 2000);
    }
  }
}

// Save profile updates
async function saveProfile(e) {
  e.preventDefault();
  alertMessage.style.display = "none";

  // Basic validation: name required
  if (!nameField.value.trim()) {
    showAlert("Name is required", "error");
    nameField.focus();
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const updatedData = {
    name: nameField.value.trim(),
    careerGoals: careerField.value.trim(),
  };

  // PUT request to update the profile at the correct endpoint
  try {
    await axios.put(`${API_BASE_URL}/api/users/updateprofile`, updatedData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    showAlert("Profile updated successfully", "success");
    originalData = { ...originalData, ...updatedData };
    updatedAtField.value = new Date().toLocaleString();
    exitEditMode();
  } catch (err) {
    showAlert("Failed to update profile. Please try again.", "error");
  }
}

// Cancel edits and revert to original data
function cancelEdit() {
  nameField.value = originalData.name || "";
  careerField.value = originalData.careerGoals || "";
  exitEditMode();
}

document.addEventListener("DOMContentLoaded", loadProfile);
editBtn.addEventListener("click", enterEditMode);
saveBtn.addEventListener("click", saveProfile);
cancelBtn.addEventListener("click", cancelEdit);