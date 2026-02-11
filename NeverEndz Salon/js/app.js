// ================================
// NeverEndz Salon – Gallery Logic
// ================================

const slides = document.querySelectorAll(".gallery img");
let currentIndex = 0;

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove("active"));
  slides[index].classList.add("active");
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

function prevSlide() {
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(currentIndex);
}

// Init
if (slides.length > 0) {
  showSlide(currentIndex);
}
