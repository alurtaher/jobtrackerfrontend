// Navbar toggle
function toggleMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const toggleBtn = document.querySelector(".mobile-menu-toggle");
  const expanded = navLinks.classList.toggle("show");
  toggleBtn.setAttribute("aria-expanded", expanded);
}
// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
});

// Globals
const API_BASE_URL = "http://13.201.26.101";
let jobListings = [];
let companies = [];

const loadingDiv = document.getElementById("loading");
const jobListingsTable = document.getElementById("jobListingsTable");
const jobListingsBody = document.getElementById("jobListingsBody");
const noDataDiv = document.getElementById("noData");
const alertMessage = document.getElementById("alertMessage");
const listingModal = document.getElementById("listingModal");
const listingForm = document.getElementById("listingForm");
const modalTitle = document.getElementById("modalTitle");

// Form Elements
const listingIdInput = document.getElementById("listingId");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const applyUrlInput = document.getElementById("applyUrl");
const statusSelect = document.getElementById("status");
const companySelect = document.getElementById("companyId");

// Show alert
function showAlert(text, type = "success") {
  alertMessage.textContent = text;
  alertMessage.className =
    type === "success" ? "success-message" : "error-message";
  alertMessage.style.display = "block";
  setTimeout(() => {
    alertMessage.style.display = "none";
  }, 4000);
}

// Open modal
function openModal(edit = false) {
  if (edit) {
    modalTitle.textContent = "Edit Job Listing";
  } else {
    modalTitle.textContent = "Add Job Listing";
    listingForm.reset();
    listingIdInput.value = "";
  }
  listingModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  listingModal.classList.remove("active");
  document.body.style.overflow = "auto";
  listingForm.reset();
  listingIdInput.value = "";
}

// Load companies to dropdown
async function loadCompanies() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.get(`${API_BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    companies = res.data || [];
    companySelect.innerHTML = companies
      .map(
        (c) =>
          `<option value="${c.id}">${c.name} (${
            c.industry || "Industry N/A"
          })</option>`
      )
      .join("");
  } catch (err) {
    showAlert("Failed to load companies.", "error");
  }
}

// Load job listings
async function loadJobListings() {
  loadingDiv.style.display = "block";
  jobListingsTable.style.display = "none";
  noDataDiv.style.display = "none";
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.get(`${API_BASE_URL}/api/job-listings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    jobListings = res.data || [];
    renderJobListings();
  } catch (err) {
    showAlert("Failed to load job listings.", "error");
  } finally {
    loadingDiv.style.display = "none";
  }
}

function renderJobListings() {
  if (!jobListings.length) {
    noDataDiv.style.display = "block";
    jobListingsTable.style.display = "none";
    return;
  }
  noDataDiv.style.display = "none";
  jobListingsTable.style.display = "";
  jobListingsBody.innerHTML = jobListings
    .map(
      (job) => `
          <tr>
            <td>${escapeHTML(job.title)}</td>
            <td>${escapeHTML(job.Company?.name || "N/A")}</td>
            <td>${escapeHTML(job.Company?.industry || "N/A")}</td>
            <td style="text-transform: capitalize">${escapeHTML(
              job.status
            )}</td>
            <td>${
              job.applyUrl
                ? `<a href="${escapeHTML(
                    job.applyUrl
                  )}" target="_blank" rel="noopener noreferrer">Apply</a>`
                : "N/A"
            }</td>
            <td class="actions">
              <button class="btn-primary" onclick="editJobListing(${
                job.id
              })" aria-label="Edit job listing ${escapeHTML(
        job.title
      )}"><i class="fa fa-edit"></i></button>
              <button class="btn-danger" onclick="deleteJobListing(${
                job.id
              })" aria-label="Delete job listing ${escapeHTML(
        job.title
      )}"><i class="fa fa-trash"></i></button>
            </td>
          </tr>
        `
    )
    .join("");
}

// Escape HTML helper
function escapeHTML(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Edit job listing
async function editJobListing(id) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.get(`${API_BASE_URL}/api/job-listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const job = res.data;
    listingIdInput.value = job.id;
    titleInput.value = job.title || "";
    descriptionInput.value = job.description || "";
    applyUrlInput.value = job.applyUrl || "";
    statusSelect.value = job.status || "";
    companySelect.value = job.company_id || job.Company?.id || "";
    openModal(true);
  } catch (err) {
    showAlert("Failed to load job listing details.", "error");
  }
}

// Delete job listing
async function deleteJobListing(id) {
  if (!confirm("Are you sure you want to delete this job listing?")) return;

  try {
    const token = localStorage.getItem("authToken");
    await axios.delete(`${API_BASE_URL}/api/job-listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    showAlert("Job listing deleted successfully.", "success");
    await loadJobListings();
  } catch (err) {
    showAlert("Failed to delete job listing.", "error");
  }
}

// Submit form (create or update)
listingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate required inputs
  if (
    !titleInput.value.trim() ||
    !descriptionInput.value.trim() ||
    !applyUrlInput.value.trim() ||
    !statusSelect.value ||
    !companySelect.value
  ) {
    showAlert("Please fill in all required fields.", "error");
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    applyUrl: applyUrlInput.value.trim(),
    status: statusSelect.value,
    companyId: companySelect.value,
  };

  try {
    if (listingIdInput.value) {
      // Update existing
      await axios.put(
        `${API_BASE_URL}/api/job-listings/${listingIdInput.value}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showAlert("Job listing updated successfully.", "success");
    } else {
      // Create new
      await axios.post(`${API_BASE_URL}/api/job-listings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Job listing created successfully.", "success");
    }
    closeModal();
    loadJobListings();
  } catch (err) {
    showAlert("Failed to save job listing.", "error");
  }
});

// Modal open for add new listing
document
  .getElementById("btnAddListing")
  .addEventListener("click", () => openModal(false));

// Close modal function
function closeModal() {
  listingModal.classList.remove("active");
  document.body.style.overflow = "auto";
  listingForm.reset();
  listingIdInput.value = "";
}

// Initial load
async function init() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  await loadCompanies();
  await loadJobListings();
}

// Initialize navbar mobile toggle
document.addEventListener("DOMContentLoaded", () => {
  authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "index.html";
    return;
  }
  init();
  document.querySelector(".modal-close").addEventListener("click", closeModal);
});