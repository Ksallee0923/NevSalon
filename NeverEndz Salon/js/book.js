// js/book.js

const API_BASE = "http://localhost:4000/api/bookings";

// Salon hours from FB
const HOURS = {
  0: null, // Sun CLOSED
  1: null, // Mon CLOSED
  2: { start: "09:00", end: "18:00" },
  3: { start: "09:00", end: "18:00" },
  4: { start: "09:00", end: "18:00" },
  5: { start: "09:00", end: "17:00" },
  6: { start: "09:00", end: "17:00" },
};

const SLOT_STEP_MIN = 15;

function pad2(n) { return String(n).padStart(2, "0"); }
function toYMD(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

function parseHM(str) {
  const [h,m] = str.split(":").map(Number);
  return { h, m, mins: h*60 + m };
}

function generateSlots(dateObj, duration) {
  const day = dateObj.getDay();
  const hours = HOURS[day];
  if (!hours) return [];

  const start = parseHM(hours.start).mins;
  const end = parseHM(hours.end).mins;
  const lastStart = end - duration;

  const slots = [];
  for (let t=start; t<=lastStart; t+=SLOT_STEP_MIN) {
    const label = `${pad2(Math.floor(t/60))}:${pad2(t%60)}`;
    slots.push({ label, mins:t });
  }
  return slots;
}

function toGCalDate(dt) {
  return dt.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
}

document.addEventListener("DOMContentLoaded", initBooking);

async function initBooking() {

  const monthLabel = document.getElementById("monthLabel");
  const prevBtn = document.getElementById("monthPrev");
  const nextBtn = document.getElementById("monthNext");
  const dayCards = document.getElementById("dayCards");
  const timeTitle = document.getElementById("timeTitle");
  const timeCards = document.getElementById("timeCards");

  const stylistSel = document.getElementById("stylistSelect");
  const serviceSel = document.getElementById("serviceSelect");

  const nameInput = document.getElementById("guestName");
  const phoneInput = document.getElementById("guestPhone");
  const notesInput = document.getElementById("guestNotes");

  const modal = document.getElementById("bookingModal");
  const modalSummary = document.getElementById("modalSummary");
  const closeModal = document.getElementById("closeModal");
  const gcalLink = document.getElementById("gcalLink");
  const emailLink = document.getElementById("emailLink");

  let currentMonth = new Date();
  currentMonth.setDate(1);

  let selectedDate = null;
  let selectedTime = null;

  // Render the monthly calendar
  function renderCalendar() {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    monthLabel.textContent = currentMonth.toLocaleString("default", {month:"long", year:"numeric"});
    dayCards.innerHTML = "";

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();

    let row = document.createElement("div");
    row.className = "day-row";

    for (let i=0;i<firstDay;i++) {
      const blank = document.createElement("div");
      blank.className = "day-card day-card--empty";
      row.appendChild(blank);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d=1; d<=daysInMonth; d++) {
      const dateObj = new Date(y, m, d);
      const ymd = toYMD(dateObj);
      const closed = !HOURS[dateObj.getDay()];

      const btn = document.createElement("button");
      btn.className = "day-card";
      btn.dataset.date = ymd;
      btn.innerHTML = `<span class="day-num">${d}</span>`;

      if (dateObj < today) {
        btn.disabled = true;
        btn.classList.add("day-card--past");
      }

      if (closed) {
        btn.disabled = true;
        btn.classList.add("day-card--closed");
      }

      if (selectedDate === ymd) {
        btn.classList.add("day-card--selected");
      }

      if (!btn.disabled) {
        btn.addEventListener("click", () => {
          selectedDate = ymd;
          selectedTime = null;
          document.querySelectorAll(".day-card").forEach(c => c.classList.remove("day-card--selected"));
          btn.classList.add("day-card--selected");
          loadTimes();
        });
      }

      row.appendChild(btn);

      if ((firstDay + d) % 7 === 0 || d === daysInMonth) {
        dayCards.appendChild(row);
        row = document.createElement("div");
        row.className = "day-row";
      }
    }
  }

  async function loadTimes() {
    if (!selectedDate) return;

    timeTitle.textContent = `Available times for ${selectedDate}`;
    timeCards.innerHTML = "";

    const [y,m,d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m-1, d);

    const duration = Number(serviceSel.selectedOptions[0].dataset.mins);

    const allSlots = generateSlots(dateObj, duration);

    // Load taken
    let taken = new Set();
    try {
      const url = new URL(API_BASE + "/check");
      url.searchParams.set("date", selectedDate);
      url.searchParams.set("stylist", stylistSel.value);
      const res = await fetch(url);
      const rows = await res.json();
      rows.forEach(r => taken.add(r.time));
    } catch {}

    allSlots.forEach(slot => {
      const btn = document.createElement("button");
      btn.className = "time-card";
      btn.textContent = slot.label;

      if (taken.has(slot.label)) {
        btn.disabled = true;
        btn.classList.add("time-card--taken");
      } else {
        btn.addEventListener("click", () => {
          selectedTime = slot.label;
          document.querySelectorAll(".time-card").forEach(t => t.classList.remove("time-card--selected"));
          btn.classList.add("time-card--selected");
        });
      }
      timeCards.appendChild(btn);
    });
  }

  document.getElementById("confirmBooking").addEventListener("click", async () => {
    if (!selectedDate || !selectedTime) {
      alert("Choose a date and time first.");
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const notes = notesInput.value.trim();
    const service = serviceSel.value;
    const stylist = stylistSel.value;
    const duration = Number(serviceSel.selectedOptions[0].dataset.mins);

    if (!name || !phone) {
      alert("Enter your name and phone.");
      return;
    }

    const payload = {
      date: selectedDate,
      time: selectedTime,
      stylist,
      service,
      duration,
      name,
      phone,
      notes
    };

    try {
      const res = await fetch(API_BASE, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Booking failed");

      showModal(payload);
      loadTimes();
    }
    catch {
      alert("Failed to save appointment.");
    }
  });

  function showModal(appt) {
    const {date,time,service,stylist,duration,name,phone,notes} = appt;

    modal.classList.add("open");

    modalSummary.textContent =
      `${service} with ${stylist} on ${date} at ${time} (${duration} mins).`;

    // Build GCal link
    const [y,m,d] = date.split("-").map(Number);
    const [hh,mm] = time.split(":").map(Number);

    const start = new Date(y, m-1, d, hh, mm);
    const end = new Date(start.getTime() + duration*60000);

    const gc = new URL("https://calendar.google.com/calendar/render");
    gc.searchParams.set("action","TEMPLATE");
    gc.searchParams.set("text", `NeverEndz Salon — ${service}`);
    gc.searchParams.set("dates", `${toGCalDate(start)}/${toGCalDate(end)}`);
    gc.searchParams.set("location", "NeverEndz Salon, Florence KY");
    gc.searchParams.set("details", `Name: ${name}\nPhone: ${phone}\nNotes: ${notes}`);

    gcalLink.href = gc.toString();
    emailLink.href = `mailto:?subject=NeverEndz Appointment&body=${encodeURIComponent(modalSummary.textContent)}`;
  }

  closeModal.addEventListener("click",()=>modal.classList.remove("open"));
  modal.addEventListener("click",(e)=>{ if(e.target===modal) modal.classList.remove("open"); });

  // Initialize
  renderCalendar();
}

