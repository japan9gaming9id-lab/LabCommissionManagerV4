let doctors = JSON.parse(localStorage.getItem("doctors") || "[]");
let tests = JSON.parse(localStorage.getItem("tests") || "[]");
let entries = JSON.parse(localStorage.getItem("entries") || "[]");

function saveData() {
    localStorage.setItem("doctors", JSON.stringify(doctors));
    localStorage.setItem("tests", JSON.stringify(tests));
    localStorage.setItem("entries", JSON.stringify(entries));
}

function showTab(id) {
    document.querySelectorAll(".panel").forEach(p => {
        p.hidden = true;
    });
    document.getElementById(id).hidden = false;
    render();
}

function addDoctor() {
    let name = document.getElementById("doctorName").value.trim();
    let phone = document.getElementById("doctorPhone").value.trim();

    if (!name) return alert("Doctor name likhen");

    doctors.push({id: Date.now(), name, phone});
    saveData();

    document.getElementById("doctorName").value = "";
    document.getElementById("doctorPhone").value = "";

    render();
}

function addTest() {
    let name = document.getElementById("testName").value.trim();
    let percent = Number(document.getElementById("testPercent").value);

    if (!name || percent < 0 || percent > 100) {
        return alert("Sahi Test Name aur Commission % likhen");
    }

    tests.push({id: Date.now(), name, percent});
    saveData();

    document.getElementById("testName").value = "";
    render();
}

function calculateCommission() {
    let price = Number(document.getElementById("testPrice").value || 0);
    let percent = Number(document.getElementById("commissionPercent").value || 0);

    document.getElementById("commissionValue").textContent =
        "₹" + (price * percent / 100).toFixed(2);
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

function saveEntry() {
    let date = document.getElementById("entryDate").value;
    let patient = document.getElementById("patientName").value.trim();
    let doctor = doctors.find(d => d.id == document.getElementById("entryDoctor").value);
    let test = tests.find(t => t.id == document.getElementById("entryTest").value);
    let price = Number(document.getElementById("testPrice").value);
    let percent = Number(document.getElementById("commissionPercent").value);

    if (!date || !patient || !doctor || !test || price <= 0 || percent < 0 || percent > 100) {
        return alert("Sabhi details sahi se bharen");
    }

    entries.push({
        date, patient, doctor: doctor.name,
        test: test.name, price, percent,
        commission: price * percent / 100
    });

    saveData();
    alert("Entry Saved Successfully!");

    document.getElementById("patientName").value = "";
    document.getElementById("testPrice").value = "";
    calculateCommission();
    render();
}

function render() {
    document.getElementById("doctorList").innerHTML =
        doctors.map(d => `<p>${d.name} - ${d.phone}</p>`).join("");

    document.getElementById("testList").innerHTML =
        tests.map(t => `<p>${t.name} - ${t.percent}%</p>`).join("");

    document.getElementById("entryDoctor").innerHTML =
        doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join("");

    document.getElementById("entryTest").innerHTML =
        tests.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    document.getElementById("recordList").innerHTML =
        entries.map(e =>
            `<p>${e.date} | ${e.patient} | ${e.doctor} | ${e.test}
            | ₹${e.price} | Commission ₹${e.commission.toFixed(2)}</p>`
        ).join("");

    let totalPrice = entries.reduce((s,e) => s + e.price, 0);
    let totalCommission = entries.reduce((s,e) => s + e.commission, 0);

    document.getElementById("totalPrice").textContent = "₹" + totalPrice.toFixed(2);
    document.getElementById("totalCommission").textContent = "₹" + totalCommission.toFixed(2);
}

document.getElementById("themeBtn").onclick = function() {
    document.body.classList.toggle("dark");
};

document.getElementById("entryDate").value =
    new Date().toISOString().slice(0, 10);

render();
