const API_BASE_URL = "http://13.201.26.101";
let authToken = null;
let editingCompanyId = null;

document.addEventListener("DOMContentLoaded", () => {
  authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "index.html";
    return;
  }
  loadCompanies(); // Replaces init()
});

const messagesDiv = document.getElementById("messages");
const companyModal = document.getElementById("companyModal");
const companyForm = document.getElementById("companyForm");
const companyFormMessage = document.getElementById("companyFormMessage");
const companySubmitBtn = document.getElementById("companySubmitBtn");

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    window.location.href = "index.html";
  }
});

document
  .getElementById("addCompanyBtn")
  .addEventListener("click", () => openCompanyModal());

document
  .getElementById("closeCompanyModalBtn")
  .addEventListener("click", () => closeCompanyModal());

window.addEventListener("click", (e) => {
  if (e.target === companyModal) closeCompanyModal();
});

companyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearCompanyFormMessage();

  const name = companyForm.name.value.trim();
  if (!name) {
    showCompanyFormMessage("Company name is required.", true);
    return;
  }

  const companyData = {
    name,
    industry: companyForm.industry.value.trim(),
    size: companyForm.size.value.trim(),
    contactInfo: companyForm.contactInfo.value.trim(),
    notes: companyForm.notes.value.trim(),
  };

  companySubmitBtn.disabled = true;
  companySubmitBtn.textContent = editingCompanyId ? "Updating..." : "Saving...";

  try {
    let response;
    if (editingCompanyId) {
      response = await axios.put(
        `${API_BASE_URL}/api/companies/${editingCompanyId}`,
        companyData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    } else {
      response = await axios.post(
        `${API_BASE_URL}/api/companies`,
        companyData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    }

    if (response.status === 200 || response.status === 201) {
      closeCompanyModal();
      showMessage(
        editingCompanyId
          ? "Company updated successfully."
          : "Company added successfully."
      );
      loadCompanies();
    } else {
      showCompanyFormMessage("Failed to save the company.", true);
    }
  } catch (error) {
    console.error("Company save error:", error);
    showCompanyFormMessage(
      "Error occurred while saving the company. Please try again.",
      true
    );
  } finally {
    companySubmitBtn.disabled = false;
    companySubmitBtn.textContent = editingCompanyId ? "Update" : "Save";
  }
});

function showCompanyFormMessage(msg, isError = false) {
  companyFormMessage.textContent = msg;
  companyFormMessage.className = isError ? "message error" : "message success";
  companyFormMessage.style.display = "block";
}

function clearCompanyFormMessage() {
  companyFormMessage.style.display = "none";
  companyFormMessage.textContent = "";
}

function showMessage(msg, success = true) {
  if (!msg) return;
  const div = document.createElement("div");
  div.className = success ? "message success" : "message error";
  div.textContent = msg;
  messagesDiv.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

function openCompanyModal() {
  editingCompanyId = null;
  clearCompanyFormMessage();
  companyForm.reset();
  companyModal.classList.add("active");
  companyForm.name.focus();
}

function closeCompanyModal() {
  companyModal.classList.remove("active");
}

async function loadCompanies() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200) {
      renderCompanies(response.data);
    } else {
      showMessage("Failed to load companies.", false);
    }
  } catch (error) {
    console.error("Load companies error:", error);
    showMessage("Error loading companies. Please try again.", false);
  }
}

function renderCompanies(companies) {
  const tbody = document.querySelector("#companiesTable tbody");
  tbody.innerHTML = "";
  if (companies.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.style.textAlign = "center";
    td.textContent = 'No companies found. Click "Add Company" to create one.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  companies.forEach((company) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = company.name;

    const industryTd = document.createElement("td");
    industryTd.textContent = company.industry || "-";

    const sizeTd = document.createElement("td");
    sizeTd.textContent = company.size || "-";

    const contactTd = document.createElement("td");
    contactTd.textContent = company.contactInfo || "-";

    const notesTd = document.createElement("td");
    notesTd.textContent = company.notes || "-";

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditCompanyModal(company));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteCompany(company.id));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(nameTd);
    tr.appendChild(industryTd);
    tr.appendChild(sizeTd);
    tr.appendChild(contactTd);
    tr.appendChild(notesTd);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function openEditCompanyModal(company) {
  editingCompanyId = company.id;
  clearCompanyFormMessage();
  companyForm.name.value = company.name || "";
  companyForm.industry.value = company.industry || "";
  companyForm.size.value = company.size || "";
  companyForm.contactInfo.value = company.contactInfo || "";
  companyForm.notes.value = company.notes || "";
  document.getElementById("companyModalTitle").textContent = "Edit Company";
  companyModal.classList.add("active");
  companyForm.name.focus();
}

async function deleteCompany(id) {
  if (!confirm("Are you sure you want to delete this company?")) return;
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/companies/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200) {
      showMessage("Company deleted successfully.");
      loadCompanies();
    } else {
      showMessage("Failed to delete company.", false);
    }
  } catch (error) {
    console.error("Delete company error:", error);
    showMessage("Error deleting company. Please try again.", false);
  }
}