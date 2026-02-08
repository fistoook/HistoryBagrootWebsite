// Main.js - General utilities and initialization

// Update active nav link
document.addEventListener('DOMContentLoaded', function() {
  updateActiveNavLink();
});

function updateActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Add click handlers to all feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('click', function() {
    const link = this.querySelector('a');
    if (link) {
      window.location.href = link.getAttribute('href');
    }
  });
});
