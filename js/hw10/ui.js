const navToggle = document.querySelector('.navbar__toggle');
const navMenu = document.querySelector('.navbar__menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('navbar__menu--open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}
