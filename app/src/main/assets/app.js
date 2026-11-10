let doctors = JSON.parse(localStorage.getItem("doctors") || "[]");
let tests = JSON.parse(localStorage.getItem("tests") || "[]");
let entries = JSON.parse(localStorage.getItem("entries") || "[]");

let editingDoctorId = null;

function saveData() {
    localStorage.setItem("doctors", JSON.stringify(doctors));
    localStorage.setItem("tests", JSON.stringify(tests));
    localStorage.setItem("entries", JSON.stringify(entries));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function showTab(id) {
    document.querySelectorAll(".panel").forEach(p => {
        p.hidden = true;
    });

    document.getElementById(id).hidden = false;
    render();
}

// DOCTOR MANAGEMENT

function addDoctor() {
    let name = document.getElementById("doctorName").value.trim();
    let phone = document.getElementById("doctorPhone").value.trim();

    if (!name) {
        return alert("Doctor name likhen");
    }

    if (editingDoctorId !== null) {
        let doctor = doctors.find(d => d.id == editingDoctorId);

        if (!doctor) return alert("Doctor nahi mila");

        doctor.name = name;
        doctor.phone = phone;

        // Old entries remain unchanged.
        alert("Doctor Details Updated Successfully!");
    } else {
        doctors.push({
            id: Date.now(),
            name: name,
            phone: phone,
            active: true
        });

        alert("Doctor Added Successfully!");
    }

    saveData();
    cancelDoctorEdit();
    render();
}

function editDoctor(id) {
    let doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    editingDoctorId = doctor.id;

    document.getElementById("doctorName").value = doctor.name;
    document.getElementById("doctorPhone").value = doctor.phone || "";
    document.getElementById("doctorFormTitle").textContent = "Edit Doctor Details";
    document.getElementById("doctorSaveBtn").textContent = "Update Doctor";
    document.getElementById("doctorCancelBtn").hidden = false;

    showTab("doctors");
    document.getElementById("doctorName").focus();
}

function cancelDoctorEdit() {
    editingDoctorId = null;

    document.getElementById("doctorName").value = "";
    document.getElementById("doctorPhone").value = "";
    document.getElementById("doctorFormTitle").textContent = "Add New Doctor";
    document.getElementById("doctorSaveBtn").textContent = "Add Doctor";
    document.getElementById("doctorCancelBtn").hidden = true;
}

function toggleDoctorStatus(id) {
    let doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    let currentlyActive = doctor.active !== false;

    if (currentlyActive) {
        if (!confirm("Is Doctor ko Inactive karna chahte hain? Purane records safe rahenge.")) return;
        doctor.active = false;
    } else {
        if (!confirm("Is Doctor ko dobara Active karna chahte hain?")) return;
        doctor.active = true;
    }

    saveData();
    render();

    if (!doctor.active) {
        alert("Doctor Inactive ho gaya. Purane records safe hain.");
    } else {
        alert("Doctor Active ho gaya.");
    }
}

function renderDoctors() {
    let search = (document.getElementById("doctorSearch")?.value || "")
        .trim().toLowerCase();

    let list = document.getElementById("doctorList");

    let filtered = doctors.filter(d =>
        String(d.name || "").toLowerCase().includes(search) ||
        String(d.phone || "").toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="doctor-empty">Koi Doctor nahi mila</div>';
        return;
    }

    list.innerHTML = filtered.map(d => {
        let active = d.active !== false;

        return `
            <div class="doctor-card">
                <h3>${escapeHTML(d.name)}</h3>
                <p>Phone: ${escapeHTML(d.phone || "Not Available")}</p>

                <span class="doctor-status ${active ? "" : "inactive"}">
                    ${active ? "ACTIVE" : "INACTIVE"}
                </span>

                <div class="doctor-actions">
                    <button onclick="showDoctorDetails(${Number(d.id)})">
                        Details
                    </button>

                    <button class="btn-edit" onclick="editDoctor(${Number(d.id)})">
                        Edit
                    </button>

                    <button class="${active ? "btn-inactive" : "btn-status"}"
                        onclick="toggleDoctorStatus(${Number(d.id)})">
                        ${active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// DOCTOR FULL DETAILS

function showDoctorDetails(id) {
    let doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    document.querySelectorAll(".panel").forEach(p => {
        p.hidden = true;
    });

    document.getElementById("doctorDetails").hidden = false;

    renderDoctorDetails(id);
}

function renderDoctorDetails(id) {
    let doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    let doctorEntries = entries.filter(e =>
        e.doctorId != null
            ? e.doctorId == doctor.id
            : e.doctor === doctor.name
    );

    let totalPatients = new Set(
        doctorEntries.map(e => String(e.patient || "").trim().toLowerCase())
    ).size;

    let totalPrice = doctorEntries.reduce(
        (sum, e) => sum + Number(e.price || 0), 0
    );

    let totalCommission = doctorEntries.reduce(
        (sum, e) => sum + Number(e.commission || 0), 0
    );

    let totalTests = doctorEntries.length;
    let active = doctor.active !== false;

    let history = [...doctorEntries].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
    );

    document.getElementById("doctorDetailsContent").innerHTML = `
        <h2>${escapeHTML(doctor.name)}</h2>

        <div class="detail-box">
            <p><strong>Doctor Name:</strong> ${escapeHTML(doctor.name)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(doctor.phone || "Not Available")}</p>
            <p><strong>Status:</strong>
                <span class="doctor-status ${active ? "" : "inactive"}">
                    ${active ? "ACTIVE" : "INACTIVE"}
                </span>
            </p>
            <p><strong>Total Patients:</strong> ${totalPatients}</p>
            <p><strong>Total Tests:</strong> ${totalTests}</p>
        </div>

        <h3>Financial Summary</h3>

        <div class="detail-stat">
            <strong>Total Test Price</strong>
            <h2>${money(totalPrice)}</h2>
        </div>

        <div class="detail-stat">
            <strong>Total Commission</strong>
            <h2>${money(totalCommission)}</h2>
        </div>

        <h3>Complete Entry History</h3>

        <div id="doctorHistory">
            ${history.length === 0
                ? '<p class="doctor-empty">Abhi koi Entry available nahi hai.</p>'
                : history.map(e => `
                    <div class="detail-entry">
                        <strong>${escapeHTML(e.patient)}</strong>
                        <p>Date: ${escapeHTML(e.date)}</p>
                        <p>Test: ${escapeHTML(e.test)}</p>
                        <p>Test Price: ${money(e.price)}</p>
                        <p>Commission: ${Number(e.percent || 0)}% — ${money(e.commission)}</p>
                    </div>
                `).join("")
            }
        </div>
    `;
}

// TEST MANAGEMENT

function addTest() {
    let name = document.getElementById("testName").value.trim();
    let percent = Number(document.getElementById("testPercent").value);

    if (!name || percent < 0 || percent > 100) {
        return alert("Sahi Test Name aur Commission % likhen");
    }

    tests.push({
        id: Date.now(),
        name,
        percent
    });

    saveData();

    document.getElementById("testName").value = "";
    render();
}

// COMMISSION CALCULATION

function calculateCommission() {
    let price = Number(document.getElementById("testPrice").value || 0);
    let percent = Number(document.getElementById("commissionPercent").value || 0);

    document.getElementById("commissionValue").textContent =
        money(price * percent / 100);
}

document.getElementById("testPrice").addEventListener("input", calculateCommission);

document.getElementById("commissionPercent").addEventListener("input", calculateCommission);

document.getElementById("entryTest").addEventListener("change", function() {
    let test = tests.find(t => t.id == this.value);

    if (test) {
        document.getElementById("commissionPercent").value = test.percent;
        calculateCommission();
    }
});

// SAVE NEW ENTRY

function saveEntry() {
    let date = document.getElementById("entryDate").value;
    let patient = document.getElementById("patientName").value.trim();

    let doctor = doctors.find(d =>
        d.id == document.getElementById("entryDoctor").value &&
        d.active !== false
    );

    let test = tests.find(t =>
        t.id == document.getElementById("entryTest").value
    );

    let price = Number(document.getElementById("testPrice").value);
    let percent = Number(document.getElementById("commissionPercent").value);

    if (!date || !patient || !doctor || !test ||
        price <= 0 || percent < 0 || percent > 100) {
        return alert("Sabhi details sahi se bharen");
    }

    entries.push({
        id: Date.now(),
        date,
        patient,
        doctorId: doctor.id,
        doctor: doctor.name,
        test: test.name,
        price,
        percent,
        commission: price * percent / 100
    });

    saveData();

    alert("Entry Saved Successfully!");

    document.getElementById("patientName").value = "";
    document.getElementById("testPrice").value = "";

    calculateCommission();
    render();
}

// RENDER ALL DATA

function render() {
    renderDoctors();

    document.getElementById("testList").innerHTML =
        tests.map(t =>
            `<p>${escapeHTML(t.name)} - ${Number(t.percent)}%</p>`
        ).join("");

    let activeDoctors = doctors.filter(d => d.active !== false);
    let doctorSelect = document.getElementById("entryDoctor");
    let selectedDoctor = doctorSelect.value;

    doctorSelect.innerHTML =
        '<option value="">Select Doctor</option>' +
        activeDoctors.map(d =>
            `<option value="${Number(d.id)}">${escapeHTML(d.name)}</option>`
        ).join("");

    if (activeDoctors.some(d => String(d.id) === selectedDoctor)) {
        doctorSelect.value = selectedDoctor;
    }

    let testSelect = document.getElementById("entryTest");
    let selectedTest = testSelect.value;

    testSelect.innerHTML =
        '<option value="">Select Test</option>' +
        tests.map(t =>
            `<option value="${Number(t.id)}">${escapeHTML(t.name)}</option>`
        ).join("");

    if (tests.some(t => String(t.id) === selectedTest)) {
        testSelect.value = selectedTest;
    }

    document.getElementById("recordList").innerHTML =
    entries.map((e, index) => `
        <div class="detail-entry">
            <strong>${index + 1}. ${escapeHTML(e.patient)}</strong>
            <p>Date: ${escapeHTML(e.date)}</p>
            <p>Doctor: ${escapeHTML(e.doctor)}</p>
            <p>Test: ${escapeHTML(e.test)}</p>
            <p>Test Price: ${money(e.price)}</p>
            <p>Commission: ${money(e.commission)}</p>
        </div>
    `).join("");

    let totalPrice = entries.reduce((s, e) => s + Number(e.price || 0), 0);
    let totalCommission = entries.reduce((s, e) => s + Number(e.commission || 0), 0);

    document.getElementById("totalPrice").textContent = money(totalPrice);
    document.getElementById("totalCommission").textContent = money(totalCommission);
}

// THEME

document.getElementById("themeBtn").onclick = function() {
    document.body.classList.toggle("dark");
};

// DEFAULT DATE

document.getElementById("entryDate").value =
    new Date().toISOString().slice(0, 10);

render();
