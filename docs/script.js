(function () {
  'use strict';

  // ── Theme ───────────────────────────────────────────────
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('.theme-toggle i').forEach(function (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    });
  }

  function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.querySelectorAll('.theme-toggle i').forEach(function (icon) {
        icon.className = 'bi bi-sun';
      });
    }
  }

  // ── Mobile Nav ──────────────────────────────────────────
  function initMobileNav() {
    var hamburger = document.querySelector('.nav-hamburger');
    var menu = document.getElementById('nav-menu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', function () {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      menu.classList.toggle('open');
    });

    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Active Nav Tracking ─────────────────────────────────
  function initActiveNav() {
    var sections = document.querySelectorAll('.section[id]');
    var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    var indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    var navList = document.querySelector('.nav-links');
    if (navList) navList.appendChild(indicator);

    function moveIndicator(activeLink) {
      if (!activeLink || !indicator.parentElement) return;
      var rect = activeLink.getBoundingClientRect();
      var parentRect = navList.getBoundingClientRect();
      indicator.style.width = rect.width + 'px';
      indicator.style.transform = 'translateX(' + (rect.left - parentRect.left) + 'px)';
      indicator.style.opacity = '1';
    }

    function update() {
      var scrollY = window.scrollY + 120;
      var active = null;

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute('id');
        var link = document.querySelector('.nav-links a[href="#' + id + '"]');
        if (!link) return;

        if (scrollY >= top && scrollY < top + height) {
          link.classList.add('active');
          active = link;
        } else {
          link.classList.remove('active');
        }
      });

      if (active) moveIndicator(active);
      else indicator.style.opacity = '0';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    requestAnimationFrame(update);
  }

  // ── Scroll Progress Bar ─────────────────────────────────
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
      var winH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = winH > 0 ? (window.scrollY / winH) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  // ── Scroll Reveal with Stagger ──────────────────────────
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;

        var parent = el.parentElement;
        if (parent) {
          var siblings = parent.querySelectorAll(':scope > .reveal');
          var idx = Array.prototype.indexOf.call(siblings, el);
          el.style.transitionDelay = (idx * 80) + 'ms';
        }

        el.classList.add('visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  // ── Git Log Animation ───────────────────────────────────
  function initGitLog() {
    var gitLog = document.querySelector('.git-log');
    if (!gitLog) return;

    var commits = gitLog.querySelectorAll('.git-commit');
    if (!commits.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('git-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    commits.forEach(function (commit, i) {
      commit.style.transitionDelay = (i * 60) + 'ms';
      observer.observe(commit);
    });

    commits.forEach(function (commit) {
      commit.addEventListener('click', function () {
        var detailId = commit.getAttribute('data-detail');
        if (detailId) {
          var dialog = document.getElementById(detailId);
          if (dialog) dialog.showModal();
        }
      });
    });
  }

  // ── Skill Tags Cascade ──────────────────────────────────
  function initSkillCascade() {
    var container = document.querySelector('.skill-tags');
    if (!container) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var tags = container.querySelectorAll('.skill-tag');
        tags.forEach(function (tag, i) {
          tag.style.animationDelay = (i * 50) + 'ms';
          tag.classList.add('skill-tag-in');
        });
        observer.unobserve(container);
      });
    }, { threshold: 0.2 });

    observer.observe(container);
  }

  // ── Dialog ──────────────────────────────────────────────
  function initDialogs() {
    document.querySelectorAll('[data-open-dialog]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-open-dialog');
        var dialog = document.getElementById(id);
        if (dialog) dialog.showModal();
      });
    });

    document.querySelectorAll('.dialog-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dialog = btn.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    document.querySelectorAll('.site-dialog').forEach(function (dialog) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
      });
    });
  }

  // ── Nav Shrink on Scroll ────────────────────────────────
  function initNavShrink() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    }, { passive: true });
  }

  // ── Tilt on Hover (subtle 3D) ───────────────────────────
  function initCardTilt() {
    document.querySelectorAll('.pub-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var midX = rect.width / 2;
        var midY = rect.height / 2;
        var rotateY = ((x - midX) / midX) * 2;
        var rotateX = ((midY - y) / midY) * 2;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-2px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // ── Init ────────────────────────────────────────────────
  initTheme();

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initActiveNav();
    initScrollProgress();
    initReveal();
    initGitLog();
    initSkillCascade();
    initDialogs();
    initNavShrink();
    initCardTilt();

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  });
})();
