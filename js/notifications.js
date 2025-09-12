// Modal close on background click
document.addEventListener("DOMContentLoaded", async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }
  ensureAuth();
  await loadJobApplications();
  await loadReminders();
  document
    .getElementById("reminderModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeReminderModal();
    });
});

// Navigation Logic
function toggleMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const toggleButton = document.querySelector(".mobile-menu-toggle");
  const isExpanded = navLinks.classList.toggle("show");
  toggleButton.setAttribute("aria-expanded", isExpanded);
}
document.getElementById("logoutBtn").addEventListener("click", function () {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
});

// Globals
const API_BASE_URL = "http://13.201.26.101";
let authToken = null;
let reminders = [];
let jobApps = [];

// UI Helpers
function showAlert(text, type = "success") {
  const div = document.getElementById("alert");
  div.textContent = text;
  div.className = "alert-msg alert-" + type;
  div.style.display = "";
  setTimeout(() => {
    div.style.display = "none";
  }, 3200);
}
function ensureAuth() {
  authToken = localStorage.getItem("authToken");
  if (!authToken || !localStorage.getItem("user")) {
    window.location.href = "index.html";
  }
}
function escapeHTML(str) {
  return (str || "").replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ])
  );
}

// Reminders CRUD
function renderReminders() {
  const list = document.getElementById("remindersList");
  if (!reminders.length) {
    list.innerHTML = `<div class='no-reminders'>No reminders yet. Click 'Add Reminder'.</div>`;
    return;
  }
  list.innerHTML = "";
  reminders.forEach((rem) => {
    let dt = new Date(rem.reminderDate);
    let dateStr = dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    let timeStr = dt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    let company = rem.JobApplication?.companyName || "N/A";
    let jobTitle = rem.JobApplication?.jobTitle || "";
    list.innerHTML += `
                <div class="reminder-card">
                    <div class="reminder-details">
                        <div class="reminder-date"><i class="fa fa-calendar"></i> ${dateStr} ${timeStr}</div>
                        <div class="reminder-job">${escapeHTML(
                          jobTitle
                        )} <span style="color:#7f8c8d;font-weight:400;">@</span> ${escapeHTML(
      company
    )}</div>
                        <div class="reminder-message">${escapeHTML(
                          rem.message
                        )}</div>
                    </div>
                    <div class="reminder-actions">
                        <button class="update" onclick="openReminderModal(${
                          rem.id
                        })"><i class="fa fa-edit"></i></button>
                        <button class="delete" onclick="deleteReminder(${
                          rem.id
                        })"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            `;
  });
}

// Modal Logic
function openReminderModal(id = null) {
  document.getElementById("reminderModal").style.display = "flex";
  document.body.style.overflow = "hidden";
  const form = document.getElementById("reminderForm");
  if (id) {
    // Edit Existing
    const data = reminders.find((r) => r.id == id);
    document.getElementById("modalTitle").innerText = "Edit Reminder";
    document.getElementById("reminderId").value = id;
    document.getElementById("jobApplicationId").value = data.jobApplicationId;
    // Parse local date & time
    const dtRem = new Date(data.reminderDate);
    document.getElementById("reminderDate").value = dtRem
      .toISOString()
      .substring(0, 10);
    document.getElementById("reminderTime").value = dtRem
      .toISOString()
      .substring(11, 16);
    document.getElementById("message").value = data.message;
  } else {
    // New Reminder
    form.reset();
    document.getElementById("modalTitle").innerText = "Add Reminder";
    document.getElementById("reminderId").value = "";
    // Set default to now
    let now = new Date();
    document.getElementById("reminderDate").value = now
      .toISOString()
      .substring(0, 10);
    document.getElementById("reminderTime").value = now
      .toISOString()
      .substring(11, 16);
  }
}
function closeReminderModal() {
  document.getElementById("reminderModal").style.display = "none";
  document.body.style.overflow = "auto";
}

async function loadJobApplications() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/job-applications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    jobApps = res.data || [];
    let sel = document.getElementById("jobApplicationId");
    sel.innerHTML = jobApps
      .map(
        (j) =>
          `<option value="${j.id}">${escapeHTML(j.jobTitle)} @ ${escapeHTML(
            j.companyName
          )}</option>`
      )
      .join("");
  } catch {
    showAlert("Failed to load job applications", "error");
  }
}
async function loadReminders() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/reminders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    reminders = res.data || [];
    renderReminders();
  } catch {
    showAlert("Failed to load reminders", "error");
  }
}
async function submitReminder(e) {
  e.preventDefault();
  const id = document.getElementById("reminderId").value;
  const dateVal = document.getElementById("reminderDate").value;
  const timeVal = document.getElementById("reminderTime").value;
  // Combine date + time for MySQL DATETIME
  let reminderDateTime = dateVal && timeVal ? `${dateVal}T${timeVal}` : ""; // e.g. 2025-09-09T14:35
  const data = {
    jobApplicationId: document.getElementById("jobApplicationId").value,
    reminderDate: reminderDateTime,
    message: document.getElementById("message").value,
  };
  try {
    if (id) {
      await axios.put(`${API_BASE_URL}/api/reminders/${id}`, data, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      showAlert("Reminder updated");
    } else {
      await axios.post(`${API_BASE_URL}/api/reminders`, data, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      showAlert("Reminder created", "success");
    }
    closeReminderModal();
    await loadReminders();
  } catch {
    showAlert("Failed to save reminder", "error");
  }
}
async function deleteReminder(id) {
  if (!confirm("Delete this reminder?")) return;
  try {
    await axios.delete(`${API_BASE_URL}/api/reminders/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    showAlert("Reminder deleted", "success");
    await loadReminders();
  } catch {
    showAlert("Failed to delete", "error");
  }
}