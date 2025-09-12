const API_BASE_URL = "http://13.201.26.101";
let authToken = null;
let editingApplicationId = null;

document.addEventListener("DOMContentLoaded", () => {
  authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }
  loadApplications();
});

function toggleMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const toggleButton = document.querySelector(".mobile-menu-toggle");
  const isExpanded = navLinks.classList.toggle("show");
  toggleButton.setAttribute("aria-expanded", isExpanded);
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
});

document.getElementById("addApplicationBtn").addEventListener("click", () => {
  openModalForAdd();
});

const modal = document.getElementById("applicationModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");

modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function openModalForAdd() {
  editingApplicationId = null;
  document.getElementById("modalTitle").textContent = "Add Job Application";
  form.reset();
  formMessage.style.display = "none";
  modal.classList.add("active");
  form.companyName.focus();
}

async function openModalForEdit(id) {
  editingApplicationId = id;
  document.getElementById("modalTitle").textContent = "Edit Job Application";
  formMessage.style.display = "none";

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/job-applications/${id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    if (response.status === 200) {
      const app = response.data;
      form.companyName.value = app.companyName;
      form.jobTitle.value = app.jobTitle;
      form.applicationDate.value = app.applicationDate.split("T")[0];
      form.status.value = app.status;
      form.notes.value = app.notes || "";
    } else {
      alert("Failed to load application data.");
      return;
    }
  } catch (error) {
    alert("Error fetching application data.");
    return;
  }
  modal.classList.add("active");
  form.companyName.focus();
}

function closeModal() {
  modal.classList.remove("active");
}

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
let allApplications = [];

async function loadApplications() {
  try {
    renderMessage("", false);
    const response = await axios.get(`${API_BASE_URL}/api/job-applications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200) {
      allApplications = response.data;
      applyFilters();
    } else {
      renderMessage("Failed to load job applications.", true);
    }
  } catch {
    renderMessage(
      "Error loading job applications. Please try again later.",
      true
    );
  }
}

function applyFilters() {
  let filteredApps = allApplications;
  const searchTerm = searchInput.value.trim().toLowerCase();
  const statusValue = statusFilter.value;

  if (searchTerm) {
    filteredApps = filteredApps.filter(
      (app) =>
        app.companyName.toLowerCase().includes(searchTerm) ||
        app.jobTitle.toLowerCase().includes(searchTerm)
    );
  }

  if (statusValue) {
    filteredApps = filteredApps.filter(
      (app) => app.status.toLowerCase() === statusValue
    );
  }

  renderApplications(filteredApps);
}

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

function renderApplications(applications) {
  const tbody = document.querySelector("#applicationList tbody");
  tbody.innerHTML = "";

  if (!applications.length) {
    const noDataRow = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.colSpan = 5;
    noDataCell.textContent =
      'No job applications found. Click "Add New Application" to get started.';
    noDataCell.style.textAlign = "center";
    noDataRow.appendChild(noDataCell);
    tbody.appendChild(noDataRow);
    return;
  }

  applications.forEach((app) => {
    const tr = document.createElement("tr");
    const jobTd = document.createElement("td");
    const jobTitle = document.createElement("div");
    jobTitle.textContent = app.jobTitle;
    jobTitle.title = app.jobTitle;
    jobTitle.style.fontWeight = "600";
    const companyDate = document.createElement("div");
    companyDate.textContent = `${app.companyName} — ${new Date(
      app.applicationDate
    ).toLocaleDateString()}`;
    companyDate.title = `${app.companyName} — ${new Date(
      app.applicationDate
    ).toLocaleDateString()}`;
    companyDate.style.fontSize = "0.9rem";
    companyDate.style.color = "var(--text-secondary)";
    jobTd.appendChild(jobTitle);
    jobTd.appendChild(companyDate);

    const notesTd = document.createElement("td");
    notesTd.textContent = app.notes || "-";
    notesTd.title = app.notes || "";
    notesTd.style.whiteSpace = "normal";
    notesTd.style.maxWidth = "250px";
    notesTd.style.overflow = "hidden";
    notesTd.style.textOverflow = "ellipsis";

    const filesTd = document.createElement("td");
    filesTd.style.whiteSpace = "nowrap";
    const filesDiv = document.createElement("div");
    filesDiv.className = "file-links";

    const resumeLink = document.createElement("a");
    resumeLink.href = "#";
    resumeLink.textContent = app.resumePath
      ? app.resumeName || "Resume"
      : "No Resume uploaded";
    resumeLink.className = app.resumePath ? "" : "no-file";
    resumeLink.style.color = app.resumePath
      ? "var(--primary-color)"
      : "var(--text-secondary)";
    resumeLink.style.cursor = app.resumePath ? "pointer" : "default";
    resumeLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (app.resumePath) {
        window.open(app.resumePath, "_blank");
      } else {
        alert("You have not uploaded a resume for this application.");
      }
    });
    filesDiv.appendChild(resumeLink);

    const coverLetterLink = document.createElement("a");
    coverLetterLink.href = "#";
    coverLetterLink.textContent = app.coverLetterPath
      ? app.coverLetterName || "Cover Letter"
      : "No Cover Letter uploaded";
    coverLetterLink.className = app.coverLetterPath ? "" : "no-file";
    coverLetterLink.style.color = app.coverLetterPath
      ? "var(--primary-color)"
      : "var(--text-secondary)";
    coverLetterLink.style.cursor = app.coverLetterPath ? "pointer" : "default";
    coverLetterLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (app.coverLetterPath) {
        window.open(app.coverLetterPath, "_blank");
      } else {
        alert("You have not uploaded a cover letter for this application.");
      }
    });
    filesDiv.appendChild(coverLetterLink);

    filesTd.appendChild(filesDiv);

    const statusTd = document.createElement("td");
    statusTd.className = "status-cell";
    const statusSpan = document.createElement("span");
    statusSpan.className = `status-badge status-${app.status.toLowerCase()}`;
    statusSpan.textContent = app.status;
    statusTd.appendChild(statusSpan);

    const actionsTd = document.createElement("td");
    actionsTd.style.textAlign = "center";
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.title = "Edit application";
    editBtn.addEventListener("click", () => openModalForEdit(app.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Delete application";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteApplication(app.id));

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);
    actionsTd.appendChild(btnGroup);

    tr.appendChild(jobTd);
    tr.appendChild(notesTd);
    tr.appendChild(filesTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function renderMessage(msg, isError = false) {
  const container = document.getElementById("messages");
  container.innerHTML = "";
  if (!msg) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "message " + (isError ? "error" : "success");
  messageDiv.textContent = msg;
  container.appendChild(messageDiv);
  setTimeout(() => {
    messageDiv.remove();
  }, 4000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  renderMessage("", false);
  formMessage.style.display = "none";
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const companyName = form.companyName.value.trim();
  const jobTitle = form.jobTitle.value.trim();
  const applicationDate = form.applicationDate.value;
  const status = form.status.value;
  const notes = form.notes.value.trim();
  const resumeFile = form.resume.files[0];
  const coverLetterFile = form.coverLetter.files[0];

  if (!companyName || !jobTitle || !applicationDate || !status) {
    formMessage.textContent = "Please fill in all required fields.";
    formMessage.className = "message error";
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

    let response;
    if (editingApplicationId) {
      response = await axios.put(
        `${API_BASE_URL}/api/job-applications/${editingApplicationId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } else {
      response = await axios.post(
        `${API_BASE_URL}/api/job-applications`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }

    if (response.status === 200 || response.status === 201) {
      renderMessage(
        editingApplicationId
          ? "Application updated successfully."
          : "Application added successfully.",
        false
      );
      closeModal();
      await loadApplications();
    } else {
      formMessage.textContent = "Failed to save application.";
      formMessage.className = "message error";
      formMessage.style.display = "block";
    }
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Error saving application. Try again.";
    formMessage.className = "message error";
    formMessage.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

async function deleteApplication(id) {
  if (!confirm("Are you sure you want to delete this application?")) return;

  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/job-applications/${id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (response.status === 200) {
      renderMessage("Application deleted successfully.", false);
      loadApplications();
    } else {
      renderMessage("Failed to delete application.", true);
    }
  } catch (error) {
    console.error(error);
    renderMessage("Error deleting application. Please try again.", true);
  }
}