// ── Menu overlay ─────────────────────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const overlayNav = document.getElementById('overlayNav');

menuToggle.addEventListener('click', () => {
  const isOpen = overlayNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
});

overlayNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    overlayNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// ── Scroll reveal ────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ── Contact form ─────────────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = contactForm.name.value;
  const email = contactForm.email.value;
  const message = contactForm.message.value;
  const subject = encodeURIComponent(`Contact portfolio — ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:mathieudome30@gmail.com?subject=${subject}&body=${body}`;
});

// ── Carousels ────────────────────────────────────────────────────────
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const prevBtn = carousel.querySelector('[data-prev]');
  const nextBtn = carousel.querySelector('[data-next]');

  const scrollAmount = () => track.querySelector('.card')?.offsetWidth + 20 || 300;

  prevBtn?.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  nextBtn?.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
});
