
// ==========================================
// LAB COMMISSION MANAGER V4
// Complete app.js - Multi Test Entry Version
// ==========================================

// ---------- LOAD DATA ----------

let doctors = JSON.parse(localStorage.getItem("doctors") || "[]");
let tests = JSON.parse(localStorage.getItem("tests") || "[]");
let entries = JSON.parse(localStorage.getItem("entries") || "[]");

let selectedPatientTests = [];
let editingEntryId = null;
let editingPatientTestIndex = null;
let editingDoctorId = null;
let editingTestId = null;
let currentDoctorId = null;


// ---------- COMMON FUNCTIONS ----------

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
        "'": "&#039;"
    })[char]);
}

function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value;
}

// Older entries used entry.test, entry.price and entry.commission.
// New entries use entry.tests[].
function getEntryTests(entry) {
    if (Array.isArray(entry.tests)) {
        return entry.tests;
    }

    if (entry.test) {
        return [{
            test: entry.test,
            price: Number(entry.price || 0),
            percent: Number(entry.percent || 0),
            commission: Number(entry.commission || 0)
        }];
    }

    return [];
}

function getEntryTotalPrice(entry) {
    if (Array.isArray(entry.tests)) {
        return getEntryTests(entry).reduce(
            (sum, test) => sum + Number(test.price || 0), 0
        );
    }

    return Number(entry.price || 0);
}

function getEntryTotalCommission(entry) {
    if (Array.isArray(entry.tests)) {
        return getEntryTests(entry).reduce(
            (sum, test) => sum + Number(test.commission || 0), 0
        );
    }

    return Number(entry.commission || 0);
}



// ---------- NAVIGATION ----------

function showTab(tabName) {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.hidden = true;
    });

    const selectedPanel = getElement(tabName);
    if (selectedPanel) selectedPanel.hidden = false;

    document.querySelectorAll(".nav-btn, .nav-item").forEach(button => {
        button.classList.remove("active");
    });

    if (tabName === "doctorDetails") {
        const details = getElement("doctorDetails");
        if (details) details.hidden = false;
    }

    if (tabName === "tests") renderTests();
    if (tabName === "doctors") renderDoctors();
    if (tabName === "records") renderRecords();

    if (tabName === "commissionStatement") {
        renderStatementDoctorOptions();
    }

    window.scrollTo(0, 0);
}



// ---------- DOCTOR MANAGEMENT ----------

function addDoctor() {
    const nameInput = getElement("doctorName");
    const phoneInput = getElement("doctorPhone");

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!name) {
        alert("Doctor Name likhen");
        return;
    }

    if (editingDoctorId !== null) {
        const doctor = doctors.find(d => d.id == editingDoctorId);
        if (!doctor) return alert("Doctor nahi mila");

        doctor.name = name;
        doctor.phone = phone;

        alert("Doctor Updated Successfully!");
    } else {
        doctors.push({
            id: Date.now(),
            name,
            phone,
            active: true
        });

        alert("Doctor Added Successfully!");
    }

    saveData();
    cancelDoctorEdit();
    render();
}

function editDoctor(id) {
    const doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    editingDoctorId = doctor.id;

    if (getElement("doctorName")) {
        getElement("doctorName").value = doctor.name || "";
    }

    if (getElement("doctorPhone")) {
        getElement("doctorPhone").value = doctor.phone || "";
    }

    setText("doctorFormTitle", "Edit Doctor");
    setText("doctorSaveBtn", "Update Doctor");

    if (getElement("doctorCancelBtn")) {
        getElement("doctorCancelBtn").hidden = false;
    }
}

function cancelDoctorEdit() {
    editingDoctorId = null;

    if (getElement("doctorName")) getElement("doctorName").value = "";
    if (getElement("doctorPhone")) getElement("doctorPhone").value = "";

    setText("doctorFormTitle", "Add New Doctor");
    setText("doctorSaveBtn", "Add Doctor");

    if (getElement("doctorCancelBtn")) {
        getElement("doctorCancelBtn").hidden = true;
    }
}

function toggleDoctorStatus(id) {
    const doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    if (doctor.active !== false) {
        if (!confirm("Is Doctor ko Inactive karna chahte hain? Purane records safe rahenge.")) {
            return;
        }
        doctor.active = false;
    } else {
        if (!confirm("Is Doctor ko dobara Active karna chahte hain?")) {
            return;
        }
        doctor.active = true;
    }

    saveData();
    render();

    alert(doctor.active === false
        ? "Doctor Inactive ho gaya."
        : "Doctor Active ho gaya.");
}

function renderDoctors() {
    const list = getElement("doctorList");
    if (!list) return;

    const search = (
        getElement("doctorSearch")?.value || ""
    ).trim().toLowerCase();

    const filtered = doctors.filter(doctor =>
        String(doctor.name || "").toLowerCase().includes(search) ||
        String(doctor.phone || "").toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="doctor-empty">Koi Doctor nahi mila</div>';
        return;
    }

    list.innerHTML = filtered.map(doctor => {
        const active = doctor.active !== false;

        return `
            <div class="doctor-card">
                <h3>${escapeHTML(doctor.name)}</h3>
                <p>${escapeHTML(doctor.phone || "Phone not added")}</p>

                <span class="doctor-status ${active ? "" : "inactive"}">
                    ${active ? "ACTIVE" : "INACTIVE"}
                </span>

                <div class="doctor-actions">
                    <button onclick="showDoctorDetails(${Number(doctor.id)})">
                        View Details
                    </button>

                    <button class="btn-edit"
                        onclick="editDoctor(${Number(doctor.id)})">
                        Edit
                    </button>

                    <button class="${active ? "btn-inactive" : "btn-status"}"
                        onclick="toggleDoctorStatus(${Number(doctor.id)})">
                        ${active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function showDoctorDetails(id) {
    const doctor = doctors.find(d => d.id == id);
    if (!doctor) return;

    currentDoctorId = doctor.id;

    showTab("doctorDetails");
    renderDoctorDetails();
}

function renderDoctorDetails() {
    const doctor = doctors.find(d => d.id == currentDoctorId);
    const container = getElement("doctorDetailsContent");

    if (!doctor || !container) return;

    const doctorEntries = entries.filter(entry =>
        entry.doctorId == doctor.id ||
        (
            entry.doctorId == null &&
            entry.doctor === doctor.name
        )
    );

    let totalTests = 0;
    let totalPrice = 0;
    let totalCommission = 0;

    doctorEntries.forEach(entry => {
        const entryTests = getEntryTests(entry);
        totalTests += entryTests.length;

        entryTests.forEach(test => {
            totalPrice += Number(test.price || 0);
            totalCommission += Number(test.commission || 0);
        });
    });

    container.innerHTML = `
        <div class="doctor-card">
            <h2>${escapeHTML(doctor.name)}</h2>
            <p>Phone: ${escapeHTML(doctor.phone || "Not added")}</p>
            <p>Status: ${doctor.active === false ? "INACTIVE" : "ACTIVE"}</p>

            <div class="stats-grid">
                <div>
                    <h3>${totalTests}</h3>
                    <p>Total Tests</p>
                </div>
                <div>
                    <h3>${money(totalPrice)}</h3>
                    <p>Total Test Price</p>
                </div>
                <div>
                    <h3>${money(totalCommission)}</h3>
                    <p>Total Commission</p>
                </div>
            </div>
        </div>

        <h3>Complete History</h3>

        ${
            doctorEntries.length === 0
            ? '<div class="doctor-empty">Abhi koi record nahi hai</div>'
            : doctorEntries.slice().reverse().map(entry => `
                <div class="doctor-card">
                    <h3>${escapeHTML(entry.patient || "Patient")}</h3>
                    <p>Date: ${escapeHTML(entry.date || "-")}</p>

                    ${getEntryTests(entry).map(test => `
                        <div class="history-test">
                            <p><strong>${escapeHTML(test.test || "Test")}</strong></p>
                            <p>Price: ${money(test.price)}</p>
                            <p>Commission: ${Number(test.percent || 0)}%</p>
                            <p>Commission Amount: ${money(test.commission)}</p>
                        </div>
                    `).join("")}

                    <p><strong>Total: ${money(getEntryTotalPrice(entry))}</strong></p>
                    <p><strong>Commission: ${money(getEntryTotalCommission(entry))}</strong></p>
                </div>
            `).join("")
        }
    `;
}



// ---------- TEST MANAGEMENT ----------

function addTest() {
    const name = (getElement("testName")?.value || "").trim();

    const priceValue = getElement("testDefaultPrice")?.value ?? "";
    const defaultPrice = Number(priceValue);

    const percentValue = getElement("testPercent")?.value ?? "";
    const percent = Number(percentValue);

    if (
        !name ||
        priceValue === "" ||
        !Number.isFinite(defaultPrice) ||
        defaultPrice < 0 ||
        percentValue === "" ||
        !Number.isFinite(percent) ||
        percent < 0 ||
        percent > 100
    ) {
        alert("Sahi Test Name, Default Price aur Commission % likhen");
        return;
    }

    if (editingTestId !== null) {
        const test = tests.find(t => t.id == editingTestId);
        if (!test) return alert("Test nahi mila");

        test.name = name;
        test.price = defaultPrice;
        test.percent = percent;

        alert("Test Updated Successfully!");
    } else {
        tests.push({
            id: Date.now(),
            name,
            price: defaultPrice,
            percent,
            active: true
        });

        alert("Test Added Successfully!");
    }

    saveData();
    cancelTestEdit();
    render();
}

function editTest(id) {
    const test = tests.find(t => t.id == id);
    if (!test) return;

    editingTestId = test.id;

    if (getElement("testName")) {
        getElement("testName").value = test.name || "";
    }

    if (getElement("testDefaultPrice")) {
        getElement("testDefaultPrice").value = test.price ?? "";
    }

    if (getElement("testPercent")) {
        getElement("testPercent").value = test.percent ?? 50;
    }

    setText("testFormTitle", "Edit Test");
    setText("testSaveBtn", "Update Test");

    if (getElement("testCancelBtn")) {
        getElement("testCancelBtn").hidden = false;
    }
}

function cancelTestEdit() {
    editingTestId = null;

    if (getElement("testName")) {
        getElement("testName").value = "";
    }

    if (getElement("testDefaultPrice")) {
        getElement("testDefaultPrice").value = "";
    }

    if (getElement("testPercent")) {
        getElement("testPercent").value = 50;
    }

    setText("testFormTitle", "Add New Test");
    setText("testSaveBtn", "Add Test");

    if (getElement("testCancelBtn")) {
        getElement("testCancelBtn").hidden = true;
    }
}

function toggleTestStatus(id) {
    const test = tests.find(t => t.id == id);
    if (!test) return;

    if (test.active !== false) {
        if (!confirm("Is Test ko Inactive karna chahte hain? Purane records safe rahenge.")) {
            return;
        }
        test.active = false;
    } else {
        if (!confirm("Is Test ko dobara Active karna chahte hain?")) {
            return;
        }
        test.active = true;
    }

    saveData();
    render();

    alert(test.active === false
        ? "Test Inactive ho gaya."
        : "Test Active ho gaya.");
}

function renderTests() {
    const list = getElement("testList");
    if (!list) return;

    const search = (
        getElement("testSearch")?.value || ""
    ).trim().toLowerCase();

    const filtered = tests.filter(test =>
        String(test.name || "").toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="doctor-empty">Koi Test nahi mila</div>';
        return;
    }

    list.innerHTML = filtered.map(test => {
        const active = test.active !== false;

        return `
            <div class="doctor-card">
                <h3>${escapeHTML(test.name)}</h3>
                <p>Default Price: ₹${money(test.price || 0)}</p>
                <p>Default Commission: ${Number(test.percent || 0)}%</p>

                <span class="doctor-status ${active ? "" : "inactive"}">
                    ${active ? "ACTIVE" : "INACTIVE"}
                </span>

                <div class="doctor-actions">
                    <button class="btn-edit"
                        onclick="editTest(${Number(test.id)})">
                        Edit
                    </button>

                    <button class="${active ? "btn-inactive" : "btn-status"}"
                        onclick="toggleTestStatus(${Number(test.id)})">
                        ${active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}




// ---------- COMMISSION CALCULATION ----------

function calculateCommission() {
    const price = Number(getElement("testPrice")?.value || 0);
    const percent = Number(getElement("commissionPercent")?.value || 0);

    const commission = price * percent / 100;

    setText("commissionValue", money(commission));
}

if (getElement("testPrice")) {
    getElement("testPrice").addEventListener("input", calculateCommission);
}

if (getElement("commissionPercent")) {
    getElement("commissionPercent").addEventListener("input", calculateCommission);
}

if (getElement("entryTest")) {
    getElement("entryTest").addEventListener("change", function () {
        const test = tests.find(t => t.id == this.value);

        if (test) {
            if (getElement("testPrice")) {
                getElement("testPrice").value = test.price ?? "";
            }

            if (getElement("commissionPercent")) {
                getElement("commissionPercent").value = test.percent ?? 0;
            }

            calculateCommission();
        } else {
            if (getElement("testPrice")) {
                getElement("testPrice").value = "";
            }

            if (getElement("commissionPercent")) {
                getElement("commissionPercent").value = "";
            }

            calculateCommission();
        }
    });
}




// ---------- ADD / UPDATE PATIENT TEST ----------

function addTestToPatient() {
    const testId = getElement("entryTest")?.value;
    const priceValue = getElement("testPrice")?.value ?? "";
    const price = Number(priceValue);

    const percentValue = getElement("commissionPercent")?.value ?? "";
    const percent = Number(percentValue);

    let test;

    if (editingPatientTestIndex !== null) {
        test = selectedPatientTests[editingPatientTestIndex];
        if (!test) return;
    } else {
        if (!testId) {
            alert("Pehle Test Select Karen");
            return;
        }

        test = tests.find(t =>
            t.id == testId && t.active !== false
        );

        if (!test) {
            alert("Ye Test available nahi hai");
            return;
        }
    }

    if (
        priceValue === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        percentValue === "" ||
        !Number.isFinite(percent) ||
        percent < 0 ||
        percent > 100
    ) {
        alert("Sahi Price aur Commission % likhen");
        return;
    }

    const updatedTest = editingPatientTestIndex !== null
        ? {
            ...test,
            price,
            percent,
            commission: price * percent / 100
        }
        : {
            testId: test.id,
            test: test.name,
            price,
            percent,
            commission: price * percent / 100
        };

    if (editingPatientTestIndex !== null) {
        selectedPatientTests[editingPatientTestIndex] = updatedTest;
        editingPatientTestIndex = null;
    } else {
        selectedPatientTests.push(updatedTest);
    }

    renderSelectedPatientTests();

    if (getElement("entryTest")) getElement("entryTest").value = "";
    if (getElement("testPrice")) getElement("testPrice").value = "";
    if (getElement("commissionPercent")) getElement("commissionPercent").value = "";

    const addButton = document.querySelector(".detail-box button");
    if (addButton) addButton.textContent = "+ Add Test";

    calculateCommission();
}

// ---------- EDIT PATIENT TEST ----------

function editPatientTest(index) {
    const test = selectedPatientTests[index];

    if (!test) {
        alert("Test nahi mila");
        return;
    }

    editingPatientTestIndex = index;

    if (getElement("entryTest")) {
        getElement("entryTest").value = test.testId || "";
    }

    if (getElement("testPrice")) {
        getElement("testPrice").value = test.price;
    }

    if (getElement("commissionPercent")) {
        getElement("commissionPercent").value = test.percent;
    }

    const addButton = document.querySelector(".detail-box button");
    if (addButton) {
        addButton.textContent = "Update Test";
    }

    calculateCommission();
}

function removePatientTest(index) {

    if (editingPatientTestIndex === index) {
        editingPatientTestIndex = null;

        if (getElement("entryTest")) getElement("entryTest").value = "";
        if (getElement("testPrice")) getElement("testPrice").value = "";
        if (getElement("commissionPercent")) getElement("commissionPercent").value = "";

        const addButton = document.querySelector(".detail-box button");
        if (addButton) addButton.textContent = "+ Add Test";

    } else if (
        editingPatientTestIndex !== null &&
        editingPatientTestIndex > index
    ) {
        editingPatientTestIndex--;
    }

    selectedPatientTests.splice(index, 1);

    renderSelectedPatientTests();
    calculateCommission();
}

function renderSelectedPatientTests() {
    const list = getElement("selectedTestsList");
    if (!list) return;

    if (selectedPatientTests.length === 0) {
        list.innerHTML = '<div class="doctor-empty">Abhi koi Test add nahi hua</div>';
    } else {
        list.innerHTML = selectedPatientTests.map((test, index) => `
            <div class="doctor-card">
                <h3>${escapeHTML(test.test)}</h3>
                <p>Price: ${money(test.price)}</p>
                <p>Commission: ${Number(test.percent)}%</p>
                <p>Commission Amount: ${money(test.commission)}</p>

                <button class="btn-edit"
                    onclick="editPatientTest(${index})">
                    Edit
                </button>

                <button class="btn-inactive"
                    onclick="removePatientTest(${index})">
                    Remove
                </button>
            </div>
        `).join("");
    }

    

    const totalPrice = selectedPatientTests.reduce(
        (sum, test) => sum + Number(test.price || 0), 0
    );

    const totalCommission = selectedPatientTests.reduce(
        (sum, test) => sum + Number(test.commission || 0), 0
    );

    setText("patientTestCount", selectedPatientTests.length);
    setText("patientTotalPrice", money(totalPrice));
    setText("patientTotalCommission", money(totalCommission));
}




// ---------- SAVE / UPDATE ENTRY ----------

function saveEntry() {
    const date = getElement("entryDate")?.value || "";
    const patient = (getElement("patientName")?.value || "").trim();
    const age = (getElement("patientAge")?.value || "").trim();
    const doctorId = getElement("entryDoctor")?.value;

    if (!date) {
        alert("Date Select Karen");
        return;
    }

    if (!patient) {
        alert("Patient Name likhna zaroori hai");
        return;
    }

    if (!doctorId) {
        alert("Doctor Select Karen");
        return;
    }

    if (selectedPatientTests.length === 0) {
        alert("Kam se kam ek Test add Karen");
        return;
    }

    const doctor = doctors.find(d => d.id == doctorId);

    if (!doctor) {
        alert("Selected Doctor available nahi hai");
        return;
    }

    const savedTests = selectedPatientTests.map(test => ({
        testId: test.testId,
        test: test.test,
        price: Number(test.price),
        percent: Number(test.percent),
        commission: Number(test.price) * Number(test.percent) / 100
    }));

    const totalPrice = savedTests.reduce(
        (sum, test) => sum + test.price, 0
    );

    const totalCommission = savedTests.reduce(
        (sum, test) => sum + test.commission, 0
    );

    if (editingEntryId !== null) {
        const entry = entries.find(e => e.id == editingEntryId);

        if (!entry) {
            alert("Edit karne wala record nahi mila");
            return;
        }

        entry.date = date;
        entry.patient = patient;
        entry.age = age;
        entry.doctorId = doctor.id;
        entry.doctor = doctor.name;
        entry.tests = savedTests;
        entry.totalPrice = totalPrice;
        entry.totalCommission = totalCommission;

    } else {
        entries.push({
            id: Date.now(),
            date,
            patient,
            age,
            doctorId: doctor.id,
            doctor: doctor.name,
            tests: savedTests,
            totalPrice,
            totalCommission
        });
    }

    saveData();

    const wasEditing = editingEntryId !== null;

    editingEntryId = null;
    editingPatientTestIndex = null;
    selectedPatientTests = [];

    if (getElement("patientName")) getElement("patientName").value = "";
    if (getElement("patientAge")) getElement("patientAge").value = "";
    if (getElement("entryDate")) getElement("entryDate").value = "";
    if (getElement("entryDoctor")) getElement("entryDoctor").value = "";
    if (getElement("entryTest")) getElement("entryTest").value = "";
    if (getElement("testPrice")) getElement("testPrice").value = "";
    if (getElement("commissionPercent")) getElement("commissionPercent").value = "";

    setText("entryFormTitle", "New Patient Entry");
    setText("entrySaveBtn", "Save Patient Entry");

    if (getElement("entryCancelEditBtn")) {
        getElement("entryCancelEditBtn").hidden = true;
    }

    renderSelectedPatientTests();
    calculateCommission();
    render();

    alert(wasEditing
        ? "Entry Successfully Updated!"
        : "Entry Successfully Saved!");
}



// ---------- EDIT EXISTING ENTRY ----------

function editEntry(id) {
    const entry = entries.find(e => e.id == id);

    if (!entry) {
        alert("Record nahi mila");
        return;
    }

    editingEntryId = entry.id;

    // Patient details
    if (getElement("entryDate")) {
        getElement("entryDate").value = entry.date || "";
    }

    if (getElement("patientName")) {
        getElement("patientName").value = entry.patient || "";
    }

    if (getElement("patientAge")) {
        getElement("patientAge").value = entry.age || "";
    }

    // Doctor selection
    const doctorSelect = getElement("entryDoctor");

    if (doctorSelect) {
        const doctorExists = Array.from(doctorSelect.options)
            .some(option => option.value == entry.doctorId);

        if (!doctorExists && entry.doctorId) {
            const option = document.createElement("option");
            option.value = entry.doctorId;
            option.textContent = entry.doctor + " (Inactive)";
            doctorSelect.appendChild(option);
        }

        doctorSelect.value = entry.doctorId || "";
    }

    // Existing tests
    selectedPatientTests = getEntryTests(entry).map(test => ({
        testId: test.testId || "",
        test: test.test || "",
        price: Number(test.price || 0),
        percent: Number(test.percent || 0),
        commission: Number(
            test.commission ?? (
                Number(test.price || 0) *
                Number(test.percent || 0) / 100
            )
        )
    }));

    setText("entryFormTitle", "Edit Patient Entry");
    setText("entrySaveBtn", "Update Patient Entry");

    if (getElement("entryCancelEditBtn")) {
        getElement("entryCancelEditBtn").hidden = false;
    }

    renderSelectedPatientTests();
    calculateCommission();

    showTab("entry");
}

// ---------- CANCEL ENTRY EDIT ----------

function cancelEntryEdit() {
    editingEntryId = null;
editingPatientTestIndex = null;
selectedPatientTests = [];

    if (getElement("entryDate")) {
        getElement("entryDate").value = "";
    }

    if (getElement("patientName")) {
        getElement("patientName").value = "";
    }

    if (getElement("patientAge")) {
        getElement("patientAge").value = "";
    }

    if (getElement("entryDoctor")) {
        getElement("entryDoctor").value = "";
    }

    if (getElement("entryTest")) {
        getElement("entryTest").value = "";
    }

    if (getElement("testPrice")) {
        getElement("testPrice").value = "";
    }

    if (getElement("commissionPercent")) {
        getElement("commissionPercent").value = "";
    }

    setText("entryFormTitle", "New Patient Entry");
    setText("entrySaveBtn", "Save Patient Entry");

    if (getElement("entryCancelEditBtn")) {
        getElement("entryCancelEditBtn").hidden = true;
    }

    renderSelectedPatientTests();
    calculateCommission();
    showTab("records");
}

// ---------- RECORDS ----------
function deleteEntry(id) {
    const entry = entries.find(e => e.id == id);

    if (!entry) {
        alert("Record nahi mila");
        return;
    }

    const confirmDelete = confirm(
        "Kya aap is patient ki poori Entry delete karna chahte hain? Ye action undo nahi hoga."
    );

    if (!confirmDelete) return;

    entries = entries.filter(e => e.id != id);

    saveData();
    render();

    alert("Patient Entry Successfully Deleted!");
}
function renderRecords() {
    const list = getElement("recordList");
    if (!list) return;

    if (entries.length === 0) {
        list.innerHTML = '<div class="doctor-empty">Abhi koi Record nahi hai</div>';
        return;
    }

    const sortedEntries = entries.slice().reverse();

    list.innerHTML = sortedEntries.map((entry, index) => `
        <div class="doctor-card">
            <h3>${escapeHTML(entry.patient || "Patient")}</h3>
            <p>Date: ${escapeHTML(entry.date || "-")}</p>
            <p>Age: ${escapeHTML(entry.age || "-")}</p>
            <p>Doctor: ${escapeHTML(entry.doctor || "-")}</p>

            <h4>Tests</h4>

            ${getEntryTests(entry).map((test, testIndex) => `
                <div class="history-test">
                    <p><strong>${testIndex + 1}. ${escapeHTML(test.test || "Test")}</strong></p>
                    <p>Price: ${money(test.price)}</p>
                    <p>Commission: ${Number(test.percent || 0)}%</p>
                    <p>Commission Amount: ${money(test.commission)}</p>
                </div>
            `).join("")}

            <p><strong>Total Tests: ${getEntryTests(entry).length}</strong></p>
            <p><strong>Total Price: ${money(getEntryTotalPrice(entry))}</strong></p>
            <p><strong>Total Commission: ${money(getEntryTotalCommission(entry))}</strong></p>

<button class="btn-edit"
    onclick="editEntry(${Number(entry.id)})">
    Edit Entry
</button>

<button class="btn-inactive"
    onclick="deleteEntry(${Number(entry.id)})">
    Delete Entry
</button>

</div>
    `).join("");
}


// ---------- MAIN RENDER ----------

function render() {
    renderDoctors();
    renderTests();
    renderRecords();
    renderStatementDoctorOptions();

    // Active doctors only in New Entry
    const doctorSelect = getElement("entryDoctor");

    if (doctorSelect) {
        const currentValue = doctorSelect.value;

        const activeDoctors = doctors.filter(d => d.active !== false);

        doctorSelect.innerHTML =
            '<option value="">Select Doctor</option>' +
            activeDoctors.map(doctor => `
                <option value="${escapeHTML(doctor.id)}">
                    ${escapeHTML(doctor.name)}
                </option>
            `).join("");

        if (activeDoctors.some(d => String(d.id) === currentValue)) {
            doctorSelect.value = currentValue;
        }
    }

    // Active tests only in New Entry
    const testSelect = getElement("entryTest");

    if (testSelect) {
        const currentValue = testSelect.value;

        const activeTests = tests.filter(t => t.active !== false);

        testSelect.innerHTML =
            '<option value="">Select Test</option>' +
            activeTests.map(test => `
                <option value="${escapeHTML(test.id)}">
                    ${escapeHTML(test.name)}
                </option>
            `).join("");

        if (activeTests.some(t => String(t.id) === currentValue)) {
            testSelect.value = currentValue;
        }
    }

    // Dashboard totals count patient entries
    let totalTests = 0;
    let totalPrice = 0;
    let totalCommission = 0;

    entries.forEach(entry => {
        const entryTests = getEntryTests(entry);

        totalTests += 1;

        entryTests.forEach(test => {
            totalPrice += Number(test.price || 0);
            totalCommission += Number(test.commission || 0);
        });
    });

    setText("totalTests", totalTests);
    setText("totalPrice", money(totalPrice));
    setText("totalCommission", money(totalCommission));

    if (currentDoctorId !== null) {
        renderDoctorDetails();
    }
}



// ---------- THEME ----------

if (getElement("themeBtn")) {
    getElement("themeBtn").addEventListener("click", function () {
        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}


// ---------- SEARCH EVENTS ----------

if (getElement("doctorSearch")) {
    getElement("doctorSearch").addEventListener("input", renderDoctors);
}

if (getElement("testSearch")) {
    getElement("testSearch").addEventListener("input", renderTests);
}


// ---------- INITIAL SETUP ----------

// Default entry date = today
if (getElement("entryDate") && !getElement("entryDate").value) {
    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    getElement("entryDate").value = localDate;
}

// Initial screen render
render();


// ==========================================
// DOCTOR COMMISSION STATEMENT
// ==========================================

// Populate Doctor Dropdown
function renderStatementDoctorOptions() {
    const select = getElement("statementDoctor");
    if (!select) return;

    const currentValue = select.value || "all";

    select.innerHTML =
        '<option value="all">All Doctors</option>' +
        doctors.map(doctor => `
            <option value="${escapeHTML(doctor.id)}">
                ${escapeHTML(doctor.name)}
            </option>
        `).join("");

    select.value = currentValue;

    if (select.value !== currentValue) {
        select.value = "all";
    }
}


// Print / Save PDF




function printCommissionStatement() {

    const content = getElement("commissionStatementContent");

    if (!content || !content.querySelector(".statement-doctor")) {
        alert("Pehle Statement Generate Karen.");
        return;
    }

    const doctorValue = getElement("statementDoctor")?.value || "all";

    const doctor = doctors.find(
        d => String(d.id) === doctorValue
    );

    const title = doctor
        ? doctor.name.replace(/[^a-z0-9_-]/gi, "_") + "_Statement"
        : "All_Doctors_Statement";

    const printFrame = document.createElement("iframe");

    printFrame.style.position = "fixed";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.opacity = "0";
    printFrame.style.border = "0";
    printFrame.style.left = "0";
    printFrame.style.bottom = "0";

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;

    printFrame.onload = function () {

        printFrame.contentWindow.focus();

        setTimeout(function () {
            printFrame.contentWindow.print();
        }, 500);

    };

    printDocument.open();

    printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${escapeHTML(title)}</title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #111;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                }

                h2 {
                    text-align: center;
                    font-size: 17px;
                    margin: 0 0 15px;
                    padding: 8px;
                    color: #000;
                }

                .statement-summary {
                    margin-bottom: 20px;
                    padding: 10px;
                    border: 1px solid #000;
                }

                .statement-summary h3 {
                    margin-top: 0;
                }

                .statement-doctor {
                    margin-bottom: 25px;
                    page-break-inside: auto;
                }

                /* BLACK DOCTOR HEADER */

                .statement-header {
    display: grid !important;
    grid-template-columns: 1fr !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
    background: #000 !important;
    color: #fff !important;
    padding: 12px !important;
    margin: 0;
}

.statement-header strong {
    display: none !important;
}

.statement-header h3 {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    text-align: center !important;
    font-size: 14px !important;
    font-weight: normal !important;
    color: #fff !important;
}

                .statement-header strong,
                .statement-header h3 {
                    color: #fff;
                    margin: 0;
                    font-size: 15px;
                }

                /* BLACK DATE HEADER */

                .statement-date {

function printCommissionStatement() {

    const content = getElement("commissionStatementContent");

    if (!content || !content.querySelector(".statement-doctor")) {
        alert("Pehle Statement Generate Karen.");
        return;
    }

    const doctorValue = getElement("statementDoctor")?.value || "all";

    const doctor = doctors.find(
        d => String(d.id) === doctorValue
    );

    const title = doctor
        ? doctor.name.replace(/[^a-z0-9_-]/gi, "_") + "_Statement"
        : "All_Doctors_Statement";

    const printFrame = document.createElement("iframe");

    printFrame.style.position = "fixed";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.opacity = "0";
    printFrame.style.border = "0";
    printFrame.style.left = "0";
    printFrame.style.bottom = "0";

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;

    printFrame.onload = function () {
        printFrame.contentWindow.focus();

        setTimeout(function () {
            printFrame.contentWindow.print();
        }, 500);
    };

    printDocument.open();

    printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${escapeHTML(title)}</title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #111;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                }

                h2 {
                    text-align: center;
                    font-size: 17px;
                    margin: 0 0 15px;
                    padding: 8px;
                    color: #000;
                }

                .statement-summary {
                    margin-bottom: 20px;
                    padding: 10px;
                    border: 1px solid #000;
                }

                .statement-doctor {
                    margin-bottom: 25px;
                    page-break-inside: auto;
                }

                /* DOCTOR HEADER */

                .statement-header {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 44px;
                    background: #000;
                    color: #fff;
                    padding: 10px 12px;
                }

                .statement-header strong {
                    position: absolute;
                    left: 12px;
                    font-size: 12px;
                    font-weight: normal;
                    color: #fff;
                }

                .statement-header h3 {
                    margin: 0;
                    padding: 0 90px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 500;
                    color: #fff;
                    overflow-wrap: anywhere;
                }

                /* DATE HEADER */

                .statement-date {
                    background: #000;
                    color: #fff;
                    padding: 9px;
                    text-align: center;
                    font-weight: normal;
                    font-size: 11px;
                    margin-bottom: 10px;
                }

                .statement-table-wrap {
                    overflow: visible !important;
                }

                /* TABLE */

                .statement-table {
                    width: 100%;
                    table-layout: fixed;
                    border-collapse: collapse;
                    font-size: 10px;
                }

                .statement-table th {
                    background: #000;
                    color: #fff;
                    padding: 8px 5px;
                    text-align: left;
                    border: 1px solid #000;
                    font-weight: normal;
                }

                .statement-table td {
                    padding: 7px 5px;
                    border-bottom: 1px solid #999;
                    vertical-align: top;
                    text-align: left;
                    overflow-wrap: anywhere;
                }

                /* COLUMN WIDTHS */

                .statement-table th:nth-child(1),
                .statement-table td:nth-child(1) {
                    width: 15%;
                }

                .statement-table th:nth-child(2),
                .statement-table td:nth-child(2) {
                    width: 22%;
                }

                .statement-table th:nth-child(3),
                .statement-table td:nth-child(3) {
                    width: 33%;
                }

                .statement-table th:nth-child(4),
                .statement-table td:nth-child(4) {
                    width: 15%;
                }

                .statement-table th:nth-child(5),
                .statement-table td:nth-child(5) {
                    width: 15%;
                }

                /* AMOUNT AND DC */

                .statement-table th.amount-cell,
                .statement-table td.amount-cell {
                    text-align: right;
                    white-space: nowrap;
                }

                /* TOTAL */

                .statement-table .total-row td {
                    border-top: 1px solid #000;
                    border-bottom: 3px double #000;
                    font-weight: bold;
                    padding-top: 10px;
                    padding-bottom: 10px;
                }

                thead {
                    display: table-header-group;
                }

                tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }

                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .statement-table-wrap {
                        overflow: visible !important;
                    }
                }

            </style>
        </head>

        <body>
            <h2>DOCTOR COMMISSION STATEMENT</h2>
            ${content.innerHTML}
        </body>
        </html>
    `);

    printDocument.close();
}


async function shareCommissionStatement() {

    const content = getElement("commissionStatementContent");

    if (!content || !content.querySelector(".statement-doctor")) {
        alert("Pehle Statement Generate Karen.");
        return;
    }

    const textContent = content.innerText;

    try {
        if (navigator.share) {
            await navigator.share({
                title: "Doctor Commission Statement",
                text: textContent
            });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(textContent);
            alert("Statement copy ho gaya. Ab ise share kar sakte hain.");
        } else {
            alert("Sharing is browser par supported nahi hai.");
        }
    } catch (error) {
        if (error.name !== "AbortError") {
            alert("Statement share nahi ho paya.");
        }
    }
}


// Date Format: DD/MM/YY

function statementDate(date) {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
}

// Generate Commission Statement

function renderCommissionStatement() {

    const container = getElement("commissionStatementContent");

    if (!container) return;

    const doctorValue = getElement("statementDoctor")?.value || "all";

    const fromDate = getElement("statementFromDate")?.value || "";
    const toDate = getElement("statementToDate")?.value || "";

    if (fromDate && toDate && fromDate > toDate) {
        alert("From Date, To Date se badi nahi ho sakti.");
        return;
    }

    let selectedDoctors = doctorValue === "all"
        ? doctors
        : doctors.filter(d => String(d.id) === doctorValue);

    let statementHTML = "";

    let grandAmount = 0;
    let grandCommission = 0;
    let grandPatients = 0;

    selectedDoctors.forEach(doctor => {

        const doctorEntries = entries.filter(entry => {

            const matchesDoctor =
                entry.doctorId != null
                    ? String(entry.doctorId) === String(doctor.id)
                    : entry.doctor === doctor.name;

            const matchesFrom = !fromDate || entry.date >= fromDate;
            const matchesTo = !toDate || entry.date <= toDate;

            return matchesDoctor && matchesFrom && matchesTo;

        }).sort((a, b) => String(a.date).localeCompare(String(b.date)));

        if (doctorEntries.length === 0) return;

        let totalAmount = 0;
        let totalCommission = 0;

        const rows = doctorEntries.map(entry => {

            const amount = getEntryTotalPrice(entry);
            const commission = getEntryTotalCommission(entry);

            totalAmount += amount;
            totalCommission += commission;

            const testNames = getEntryTests(entry)
                .map(test => escapeHTML(test.test || ""))
                .join(", ");

            return `
                <tr>
                    <td>${statementDate(entry.date)}</td>
                    <td>${escapeHTML(entry.patient || "-")}</td>
                    <td>${testNames}</td>
                    <td class="amount-cell">${amount.toFixed(2)}</td>
                    <td class="amount-cell">${commission.toFixed(2)}</td>
                </tr>
            `;

        }).join("");

        grandAmount += totalAmount;
        grandCommission += totalCommission;
        grandPatients += doctorEntries.length;

        statementHTML += `
            <div class="statement-doctor">

                <div class="statement-header">
                    <strong>DOCTOR NAME</strong>
                    <h3>${escapeHTML(doctor.name)}</h3>
                </div>

                <div class="statement-date">
                    FROM ${statementDate(fromDate || doctorEntries[0].date)}
                    TO ${statementDate(toDate || doctorEntries[doctorEntries.length - 1].date)}
                </div>

                <div class="statement-table-wrap">
                    <table class="statement-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>Pt's NAME</th>
                                <th>TEST(S)</th>
                                <th class="amount-cell">AMOUNT</th>
                                <th class="amount-cell">DC</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${rows}

                            <tr class="total-row">
                                <td colspan="3">TOTAL</td>
                                <td class="amount-cell">${totalAmount.toFixed(2)}</td>
                                <td class="amount-cell">${totalCommission.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        `;
    });

    if (!statementHTML) {
        container.innerHTML = `
            <div class="doctor-empty">
                Selected Date Range mein koi Record nahi mila.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="statement-summary">
            <h3>Statement Summary</h3>
            <p>Total Patients: ${grandPatients}</p>
            <p>Total Amount: ${money(grandAmount)}</p>
            <p>Total Commission: ${money(grandCommission)}</p>
        </div>

        ${statementHTML}
    `;
}
