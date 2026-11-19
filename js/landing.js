(function () {
  'use strict';
  // This page deliberately has no connection to the personal project's storage.
  const names = { summer: 'Pure Summer', blue: 'Blue Memories', film: 'Film Diary' };
  const picker = document.querySelector('.style-picker');
  const preview = document.querySelector('#style-preview');
  picker.hidden = false;
  picker.addEventListener('click', event => {
    const button = event.target.closest('button[data-style]');
    if (!button || !Object.hasOwn(names, button.dataset.style)) return;
    const style = button.dataset.style;
    preview.dataset.theme = style;
    preview.setAttribute('aria-label', `Illustrative Memory Book pages in the ${names[style]} style.`);
    for (const option of picker.querySelectorAll('button')) option.setAttribute('aria-pressed', String(option === button));
    document.querySelector('#style-status').textContent = `${names[style]} preview selected. Your saved book has not changed.`;
  });

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
    }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
    for (const section of document.querySelectorAll('.reveal')) {
      if (section.getBoundingClientRect().top >= innerHeight) section.classList.add('is-pending');
      observer.observe(section);
    }
    document.addEventListener('focusin', event => event.target.closest('.reveal')?.classList.remove('is-pending'));
    const revealAll = () => { if (motion.matches) { observer.disconnect(); document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending')); } };
    motion.addEventListener('change', revealAll);
    // Never return from a browser-history navigation to hidden content.
    window.addEventListener('pageshow', event => { if (event.persisted) document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending')); });
  }
})();
