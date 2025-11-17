// Mobile menu
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav-links');
burger?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Theme switching
document.querySelectorAll('[data-theme]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', btn.getAttribute('data-theme'));
    localStorage.setItem('theme', btn.getAttribute('data-theme'));
  });
});
document.getElementById('toggle-dark')?.addEventListener('click', () => {
  document.documentElement.toggleAttribute('data-dark');
  localStorage.setItem('dark', document.documentElement.hasAttribute('data-dark') ? '1' : '0');
});
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
if (localStorage.getItem('dark') === '1') document.documentElement.setAttribute('data-dark', '');

// Lightbox
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lb-img');
document.querySelector('#gallery')?.addEventListener('click', (e) => {
  const img = e.target.closest('img');
  if (!img) return;
  lbImg.src = img.src;
  lb.style.display = 'flex';
});
lb?.addEventListener('click', () => lb.style.display = 'none');
window.addEventListener('keydown', e => { if (e.key === 'Escape') lb.style.display='none'; });

// Scrollspy
const sections = [...document.querySelectorAll('section[id]')];
const links = [...document.querySelectorAll('.nav-links a')].filter(a => a.getAttribute('href')?.startsWith('#'));
const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const id = entry.target.getAttribute('id');
    const link = links.find(a => a.getAttribute('href') === '#' + id);
    if (link && entry.isIntersecting) {
      links.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    }
  });
}, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
sections.forEach(s => spy.observe(s));

// Reveal-on-scroll
document.querySelectorAll('.reveal').forEach(el => el.style.opacity = 0);
const revObs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.transition = 'opacity .5s ease, transform .5s ease';
      e.target.style.transform = 'translateY(0)';
      e.target.style.opacity = 1;
      revObs.unobserve(e.target);
    }
  });
}, { threshold: .08 });
document.querySelectorAll('.reveal').forEach(el => {
  el.style.transform = 'translateY(12px)';
  revObs.observe(el);
});

/* -------- Booking (localStorage) -------- */
(() => {
  const STYLISTS = ["Ava", "Mia", "Zoe"];
  const HOURS = {
    0: null, 1: null,
    2: { start: "09:00", end: "20:00" },
    3: { start: "09:00", end: "20:00" },
    4: { start: "09:00", end: "20:00" },
    5: { start: "09:00", end: "20:00" },
    6: { start: "09:00", end: "16:00" },
  };
  const SLOT_STEP_MIN = 15;
  const STORAGE_KEY = "ne_bookings_v1";

  const $ = (sel) => document.querySelector(sel);
  const pad2 = (n) => String(n).padStart(2, "0");
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const parseHM = (s) => { const [h,m]=s.split(":").map(Number); return { h, m, mins:h*60+m }; };
  const fmtHM = (mins) => `${pad2(Math.floor(mins/60))}:${pad2(mins%60)}`;
  const load = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const save = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  let current = new Date(); current.setDate(1);
  let selectedDay = null;
  let pending = null;

  const stylistSel = $("#stylistSelect");
  const serviceSel = $("#serviceSelect");
  const durationInp = $("#durationMins");
  const calGrid = $("#calendarGrid");
  const calLabel = $("#calLabel");
  const prevBtn = $("#prevMonth");
  const nextBtn = $("#nextMonth");
  const slotTitle = $("#slotTitle");
  const slotList = $("#slotList");
  const confirmPane = $("#confirmPane");
  const confirmText = $("#confirmText");
  const confirmBtn = $("#confirmBtn");
  const cancelBtn = $("#cancelBtn");
  const nameInp = $("#guestName");
  const phoneInp = $("#guestPhone");
  const notesInp = $("#guestNotes");

  function renderCalendar(){
    const y = current.getFullYear(), m = current.getMonth();
    calLabel.textContent = current.toLocaleString(undefined, { month:"long", year:"numeric" });
    calGrid.innerHTML = "";
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
      const el = document.createElement("div"); el.className="dow"; el.textContent=d; calGrid.appendChild(el);
    });
    const firstDow = new Date(y,m,1).getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    for (let i=0;i<firstDow;i++) calGrid.appendChild(document.createElement("div"));
    for (let d=1; d<=daysInMonth; d++){
      const date = new Date(y,m,d);
      const ymd = toYMD(date);
      const open = !!HOURS[date.getDay()];
      const btn = document.createElement("button");
      btn.type="button"; btn.className="day"; btn.textContent=d; btn.setAttribute("aria-label", ymd);
      if (!open) btn.setAttribute("aria-disabled","true");
      if (selectedDay === ymd) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (!open) return;
        selectedDay = ymd;
        document.querySelectorAll(".calendar-grid .day").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        showSlotsForDay(ymd);
      });
      calGrid.appendChild(btn);
    }
  }

  function getDaySlots(ymd, durationMins){
    const d = new Date(ymd + "T00:00:00");
    const hours = HOURS[d.getDay()];
    if (!hours) return [];
    const start = parseHM(hours.start).mins;
    const end = parseHM(hours.end).mins;
    const lastStart = end - durationMins;
    const slots = [];
    for (let t=start; t<=lastStart; t+=SLOT_STEP_MIN) slots.push(t);
    return slots;
  }

  function isFree(ymd, startMins, durationMins, stylist, bookings){
    const endMins = startMins + durationMins;
    return !bookings.some(b => {
      if (b.date !== ymd || b.stylist !== stylist) return false;
      const bStart = parseHM(b.time).mins;
      const bEnd = bStart + b.duration;
      return startMins < bEnd && bStart < endMins;
    });
  }

  function showSlotsForDay(ymd){
    const durationMins = Number(durationInp.value || serviceSel.selectedOptions[0]?.dataset.mins || 45);
    const stylist = stylistSel.value;
    const bookings = load();

    slotTitle.textContent = `Available times for ${ymd} — ${stylist}`;
    slotList.innerHTML = "";

    const slots = getDaySlots(ymd, durationMins);
    if (!slots.length){ slotList.textContent = "Closed"; return; }

    slots.forEach(mins => {
      const btn = document.createElement("button");
      btn.type="button"; btn.className="slot";
      const label = fmtHM(mins);
      btn.textContent = label;

      const free = isFree(ymd, mins, durationMins, stylist, bookings);
      if (!free) btn.setAttribute("disabled","");

      btn.addEventListener("click", () => {
        if (!free) return;
        pending = { date: ymd, time: label, stylist, duration: durationMins, service: serviceSel.value };
        confirmText.textContent = `Book ${pending.service} with ${pending.stylist} on ${pending.date} at ${pending.time} (${pending.duration} mins).`;
        confirmPane.style.display = "block";
        nameInp.focus();
      });

      slotList.appendChild(btn);
    });
  }

  prevBtn?.addEventListener("click", () => { current.setMonth(current.getMonth()-1); renderCalendar(); });
  nextBtn?.addEventListener("click", () => { current.setMonth(current.getMonth()+1); renderCalendar(); });

  serviceSel?.addEventListener("change", () => {
    const mins = Number(serviceSel.selectedOptions[0]?.dataset.mins || 45);
    durationInp.value = mins;
    if (selectedDay) showSlotsForDay(selectedDay);
  });
  stylistSel?.addEventListener("change", () => { if (selectedDay) showSlotsForDay(selectedDay); });
  durationInp?.addEventListener("change", () => { if (selectedDay) showSlotsForDay(selectedDay); });

  document.getElementById("cancelBtn")?.addEventListener("click", () => {
    pending = null; confirmPane.style.display = "none";
  });

  confirmBtn?.addEventListener("click", () => {
    if (!pending) return;
    const phoneOK = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phoneInp.value.trim());
    if (!nameInp.value.trim() || !phoneOK){ alert("Please enter a name and a valid phone number."); return; }

    const bookings = load();
    const timeMins = parseHM(pending.time).mins;
    if (!isFree(pending.date, timeMins, pending.duration, pending.stylist, bookings)){
      alert("That slot was just taken."); confirmPane.style.display="none"; showSlotsForDay(pending.date); return;
    }

    bookings.push({ ...pending, name:nameInp.value.trim(), phone:phoneInp.value.trim(), notes:notesInp.value.trim() });
    save(bookings);

    alert("You're booked! ✨");
    confirmPane.style.display="none";
    nameInp.value = phoneInp.value = notesInp.value = "";
    showSlotsForDay(pending.date);
    pending = null;
  });

  (function initDay(){
    const today = new Date();
    for (let i=0;i<14;i++){
      const d = new Date(today); d.setDate(today.getDate()+i);
      if (HOURS[d.getDay()]){ selectedDay = toYMD(d); current = new Date(d.getFullYear(), d.getMonth(), 1); break; }
    }
  })();

  renderCalendar();
  if (selectedDay) showSlotsForDay(selectedDay);
})();
