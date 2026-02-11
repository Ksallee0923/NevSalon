// ==========================================
// NeverEndz Salon – Shared front-end scripts
// ==========================================

const slides = document.querySelectorAll('.gallery img');
let currentIndex = 0;

function showSlide(index) {
  slides.forEach((slide) => slide.classList.remove('active'));
  slides[index].classList.add('active');
}

function nextSlide() {
  if (!slides.length) return;
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

function prevSlide() {
  if (!slides.length) return;
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(currentIndex);
}

if (slides.length > 0) {
  showSlide(currentIndex);
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const lightbox = document.getElementById('lb');
const lightboxImage = document.getElementById('lb-img');
const galleryItems = document.querySelectorAll('.js-lightbox-gallery img');

if (lightbox && lightboxImage && galleryItems.length > 0) {
  galleryItems.forEach((img) => {
    img.addEventListener('click', () => {
      lightboxImage.src = img.dataset.full || img.src;
      lightboxImage.alt = img.alt || 'Gallery image';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  });
}
