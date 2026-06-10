/* ══════════════════════════════════════════════
   ey! — Menú Digital · script.js
   Acordeones · Navegación activa · Back to top
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── DOM REFS ────────────────────────────── */
  const backToTopBtn = document.getElementById('backToTop');
  const qnBtns = document.querySelectorAll('.qn-btn');
  const sections = document.querySelectorAll('section[id], header[id]');

  /* ══════════════════════════════════════════
     ACORDEONES
  ══════════════════════════════════════════ */
  function initAccordions() {
    const triggers = document.querySelectorAll('.accordion__trigger');

    triggers.forEach(function (trigger) {
      const bodyId = trigger.getAttribute('aria-controls');
      const body = document.getElementById(bodyId);

      if (!body) return;

      /* Pre-open acordeones marcados con .accordion--open */
      const wrapper = trigger.closest('.accordion');
      if (wrapper && wrapper.classList.contains('accordion--open')) {
        trigger.setAttribute('aria-expanded', 'true');
        body.removeAttribute('hidden');
      }

      trigger.addEventListener('click', function () {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          /* Cerrar */
          trigger.setAttribute('aria-expanded', 'false');
          /* Animar cierre: primero fijamos altura explícita, luego a 0 */
          body.style.maxHeight = body.scrollHeight + 'px';
          requestAnimationFrame(function () {
            body.style.maxHeight = '0';
          });
          /* Ocultar tras la transición */
          body.addEventListener('transitionend', function handler() {
            body.setAttribute('hidden', '');
            body.style.maxHeight = '';
            body.removeEventListener('transitionend', handler);
          });
        } else {
          /* Abrir */
          trigger.setAttribute('aria-expanded', 'true');
          body.removeAttribute('hidden');
          body.style.maxHeight = '0';
          requestAnimationFrame(function () {
            body.style.maxHeight = body.scrollHeight + 'px';
          });
          /* Limpiar inline style tras la transición */
          body.addEventListener('transitionend', function handler() {
            body.style.maxHeight = '';
            body.removeEventListener('transitionend', handler);
          });
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     BACK TO TOP
  ══════════════════════════════════════════ */
  function initBackToTop() {
    if (!backToTopBtn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 280) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════
     QUICK NAV — resaltar sección activa
  ══════════════════════════════════════════ */
  function initActiveNav() {
    if (!qnBtns.length || !sections.length) return;

    var navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '52'
    );

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          qnBtns.forEach(function (btn) {
            var href = btn.getAttribute('href');
            if (href === '#' + id) {
              btn.classList.add('is-active');
            } else {
              btn.classList.remove('is-active');
            }
          });
        }
      });
    }, {
      rootMargin: '-' + (navHeight + 10) + 'px 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(function (sec) {
      observer.observe(sec);
    });
  }

  /* ══════════════════════════════════════════
     QUICK NAV — scroll horizontal con swipe
     (accesibilidad táctil extra)
  ══════════════════════════════════════════ */
  function initNavScrollHint() {
    var track = document.querySelector('.quick-nav__track');
    if (!track) return;

    /* Centrar el botón activo al hacer tap */
    qnBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 80);
      });
    });
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initAccordions();
    initBackToTop();
    initActiveNav();
    initNavScrollHint();
    initFooterLegal();
  });

  function initFooterLegal() {
    var el = document.getElementById('currentYear');
    if (!el) return;
    try {
      el.textContent = new Date().getFullYear();
    } catch (e) {
      // noop
    }
  }

})();