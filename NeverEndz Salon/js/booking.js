// ---- SERVICE DURATIONS (minutes) ----
const SERVICE_DURATIONS = {
    "Haircut": 30,
    "Color": 120,
    "Highlights": 150,
    "Balayage": 180,
    "Style": 45,
    "Kids Cut": 20,
    "Men’s Cut": 20
};

// ---- SHARED SALON HOURS ----
const SALON_HOURS = {
    monThu: { start: 9, end: 18 },
    friSat: { start: 9, end: 17 }
};

// ---- STYLISTS ----
const stylists = ["Kathy", "Lola", "Sarah", "Zoe", "Fiona"];

// ---- Inject Stylists into Dropdown ----
const stylistSelect = document.getElementById("stylist");
stylists.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    stylistSelect.appendChild(opt);
});


// ---- Format time from 24h → AM/PM ----
function formatAMPM(hours, minutes) {
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = (hours % 12) || 12;
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m} ${ampm}`;
}


// ---- Get Salon Hours For Selected Day ----
function getHoursForDate(date) {
    const day = new Date(date).getDay(); // 0=Sun
    if (day === 0) return null; // closed Sundays
    if (day >= 1 && day <= 4) return SALON_HOURS.monThu;
    return SALON_HOURS.friSat;
}


// ---- Generate Time Slots ----
async function generateTimeSlots() {
    const date = document.getElementById("date").value;
    const service = document.getElementById("service").value;
    const stylist = stylistSelect.value;

    const timeSelect = document.getElementById("time");
    timeSelect.innerHTML = "";

    if (!date || !service || !stylist) {
        timeSelect.innerHTML = `<option>Select service, stylist & date</option>`;
        return;
    }

    const duration = SERVICE_DURATIONS[service];
    const hours = getHoursForDate(date);

    if (!hours) {
        timeSelect.innerHTML = `<option>Salon closed this day</option>`;
        return;
    }

    const start = hours.start;
    const end = hours.end;

    // Get booked times for stylist+date
    const res = await fetch(`http://localhost:4000/api/bookings/check?date=${date}&stylist=${stylist}`);
    const booked = await res.json();

    const bookedTimes = booked.map(b => b.time);

    for (let hour = start; hour < end; hour++) {
        for (let min of [0, 30]) {
            const fullTime = formatAMPM(hour, min);

            // Block if already booked
            if (bookedTimes.includes(fullTime)) continue;

            const opt = document.createElement("option");
            opt.value = fullTime;
            opt.textContent = fullTime;
            timeSelect.appendChild(opt);
        }
    }

    if (timeSelect.innerHTML.trim() === "") {
        timeSelect.innerHTML = `<option>No times available</option>`;
    }
}


// ---- Hook into form changes ----
document.getElementById("date").addEventListener("change", generateTimeSlots);
document.getElementById("service").addEventListener("change", generateTimeSlots);
document.getElementById("stylist").addEventListener("change", generateTimeSlots);


// ---- Submit Appointment ----
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();  // prevents popup auto close

    const appointment = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        service: document.getElementById("service").value,
        stylist: stylistSelect.value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        duration: SERVICE_DURATIONS[document.getElementById("service").value],
        notes: document.getElementById("notes").value
    };

    try {
        const response = await fetch("http://localhost:4000/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointment)
        });

        const data = await response.json();

        if (response.ok) {
            showConfirmation(appointment);
        } else {
            showError(data.error || "Error creating appointment");
        }

    } catch (err) {
        showError("Server error");
    }
});


// ---- Confirmation Modal ----
function showConfirmation(appt) {
    const msg =
        `Appointment confirmed!\n\n` +
        `${appt.service} with ${appt.stylist}\n` +
        `${appt.date} at ${appt.time}\n\n`;

    // KEEP POPUP OPEN UNTIL USER HITS OK
    alert(msg);
}


// ---- Error Modal ----
function showError(msg) {
    alert(msg);
}
