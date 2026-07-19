// Mobile-Navigation ein-/ausklappen
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });

  // Menü nach Klick auf einen Link schließen
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Kontaktformular: Demo-Verhalten ohne Backend
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert(
      'Vielen Dank für Ihre Nachricht!\n\n' +
      'Hinweis: Dies ist eine Demo-Website. Um das Formular produktiv zu nutzen, ' +
      'binden Sie einen Formular-Dienst oder ein eigenes Backend an.'
    );
    contactForm.reset();
  });
}
