const header = document.querySelector('.header');
const navToggle = document.querySelector('.burger');
const navLinks = document.getElementById('nav-links');

if (header && navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 860) {
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
    }
  });
}

// ==========================================
// NeverEndz Salon – Shared front-end scripts
// ==========================================

const carouselSlides = document.querySelectorAll('.gallery-stage img');
const prevButton = document.querySelector('.gallery-control.prev');
const nextButton = document.querySelector('.gallery-control.next');
const thumbButtons = document.querySelectorAll('.gallery-thumbs button');
const galleryStage = document.querySelector('.gallery-stage');
let currentIndex = 0;

function updateThumbState(index) {
  thumbButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.slide) === index);
  });
}

function showSlide(index) {
  if (!carouselSlides.length) return;

  carouselSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === index;
    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });

  currentIndex = index;
  updateThumbState(index);
}

function nextSlide() {
  if (!carouselSlides.length) return;
  const index = (currentIndex + 1) % carouselSlides.length;
  showSlide(index);
}

function prevSlide() {
  if (!carouselSlides.length) return;
  const index = (currentIndex - 1 + carouselSlides.length) % carouselSlides.length;
  showSlide(index);
}

if (carouselSlides.length > 0) {
  showSlide(currentIndex);

  if (nextButton) {
    nextButton.addEventListener('click', nextSlide);
  }

  if (prevButton) {
    prevButton.addEventListener('click', prevSlide);
  }

  thumbButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.slide);
      if (!Number.isNaN(index)) {
        showSlide(index);
      }
    });
  });

  if (galleryStage) {
    galleryStage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextSlide();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevSlide();
      }
    });
  }
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
