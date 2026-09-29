/* =========================================================
   پارسورا - Script.js
   نسخه بازنویسی‌شده و بهینه
   ========================================================= */

/* =========================================================
   اعمال فوری تم (قبل از رندر DOM)
   این کد باعث می‌شه حالت شب بدون «flash» اعمال بشه
   ========================================================= */
(function applyThemeImmediately() {
  try {
    var saved = localStorage.getItem('parsoora_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();


/* =========================================================
   اجرای اولیه پس از بارگذاری DOM
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initIndexPage();
  initProfessorCarousel();
  initProfessorsFilter();
  initCoursesFilter();
  initAuthForms();
  initScrollProgress();
  initScrollReveal();
  initCardTilt();
  initRipple();
  initBackToTop();
  initStarAnimation();
  initContactsPage();
  initSearchPage();
  initReviewsPage();
  initPasswordToggles();
  initProfessorProfile();
  initSavedPage();
  migrateSavedCoursesKeys();
  initSavedCoursesPage();
  initCoursePage();
  initThemeToggle();
});

/* =========================================================
   ابزارهای کمکی
   ========================================================= */

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
function toPersianDigits(number) {
  var persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return String(number).replace(/[0-9]/g, function (digit) {
    return persianDigits[Number(digit)];
  });
}

/**
 * تبدیل اعداد فارسی و عربی به انگلیسی
 */
function normalizeDigits(str) {
  if (str == null) return '';
  return String(str)
    .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
    .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
}

/**
 * فرار دادن HTML (برای جلوگیری از XSS)
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = String(str == null ? '' : str);
  return div.innerHTML;
}


/* =========================================================
   ذخیره‌ی استادها در localStorage
   ========================================================= */
var SAVED_PROFESSORS_KEY = 'parsoora_saved_professors';

function getSavedProfessors() {
  try {
    var raw = localStorage.getItem(SAVED_PROFESSORS_KEY);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map(function (x) { return parseInt(x, 10); })
      .filter(function (n) { return !isNaN(n); });
  } catch (e) { return []; }
}

function isProfessorSaved(id) {
  var n = parseInt(id, 10);
  if (isNaN(n)) return false;
  return getSavedProfessors().indexOf(n) !== -1;
}

function toggleProfessorSaved(id) {
  var n = parseInt(id, 10);
  if (isNaN(n)) return false;
  var list = getSavedProfessors();
  var idx = list.indexOf(n);
  if (idx === -1) {
    list.push(n);
  } else {
    list.splice(idx, 1);
  }
  try { localStorage.setItem(SAVED_PROFESSORS_KEY, JSON.stringify(list)); } catch (e) {}
  return idx === -1;
}


/* =========================================================
   ذخیره‌ی درس‌ها در localStorage
   کلید یکتا = "کددرس|کدسکشن"  (s[1] + '|' + s[2])
   ========================================================= */
var SAVED_COURSES_KEY = 'parsoora_saved_courses';
var SAVED_COURSES_MIGRATION_FLAG = 'parsoora_saved_courses_migrated_v2';

function getSavedCourses() {
  try {
    var raw = localStorage.getItem(SAVED_COURSES_KEY);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(String);
  } catch (e) { return []; }
}

function isCourseSaved(key) {
  if (!key) return false;
  return getSavedCourses().indexOf(String(key)) !== -1;
}

function toggleCourseSaved(key) {
  if (!key) return false;
  var s = String(key);
  var list = getSavedCourses();
  var idx = list.indexOf(s);
  if (idx === -1) {
    list.push(s);
  } else {
    list.splice(idx, 1);
  }
  try { localStorage.setItem(SAVED_COURSES_KEY, JSON.stringify(list)); } catch (e) {}
  return idx === -1;
}

/**
 * مهاجرت خودکار کلیدهای قدیمی دروس
 * از فرمت «فقط کد سکشن» به «کددرس|کدسکشن»
 */
function migrateSavedCoursesKeys() {
  try {
    if (localStorage.getItem(SAVED_COURSES_MIGRATION_FLAG) === '1') return;
  } catch (e) { return; }

  var oldList = [];
  try {
    var raw = localStorage.getItem(SAVED_COURSES_KEY);
    if (raw) oldList = JSON.parse(raw) || [];
  } catch (e) { oldList = []; }

  if (!Array.isArray(oldList) || oldList.length === 0) {
    try { localStorage.setItem(SAVED_COURSES_MIGRATION_FLAG, '1'); } catch (e) {}
    return;
  }

  var migrated = [];
  var seen = {};

  oldList.forEach(function (item) {
    var key = String(item);
    var newKey = key;

    /* اگر فرمت قدیمی بود (بدون |)، کد درس رو پیدا کن */
    if (key.indexOf('|') === -1 && typeof SECTIONS_DATA !== 'undefined') {
      var found = false;
      for (var i = 0; i < SECTIONS_DATA.length; i++) {
        var s = SECTIONS_DATA[i];
        if (s && s[2] === key) {
          newKey = s[1] + '|' + s[2];
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    if (newKey && !seen[newKey]) {
      seen[newKey] = true;
      migrated.push(newKey);
    }
  });

  try {
    localStorage.setItem(SAVED_COURSES_KEY, JSON.stringify(migrated));
    localStorage.setItem(SAVED_COURSES_MIGRATION_FLAG, '1');
  } catch (e) {}
}


/* =========================================================
   آپدیت بَج ذخیره‌شده‌ها
   ========================================================= */
function updateSavedBadge() {
  var profBadge = document.getElementById('saved-count-badge');
  if (profBadge) {
    profBadge.textContent = toPersianDigits(getSavedProfessors().length);
  }
  var courBadge = document.getElementById('saved-courses-count-badge');
  if (courBadge) {
    courBadge.textContent = toPersianDigits(getSavedCourses().length);
  }
}


/* =========================================================
   ساخت لیست استادها از روی SECTIONS_DATA
   ========================================================= */
function buildProfessorsFromSections() {
  if (typeof SECTIONS_DATA === 'undefined') return [];
  var map = {};
  var list = [];
  var nextId = 1;
  SECTIONS_DATA.forEach(function (s) {
    if (!s || !s.length) return;
    var name = s[3];
    if (!name || name === '—') return;
    if (!map[name]) {
      map[name] = nextId;
      list.push({
        id: nextId,
        name: name,
        field: 'مهندسی کامپیوتر'
      });
      nextId += 1;
    }
  });
  return list;
}


/* =========================================================
   تبدیل سکشن به آبجکت
   ========================================================= */
function toSectionObj(s) {
  return {
    name: s[0] || '—',
    code: s[1] || '—',
    section: s[2] || '—',
    prof: s[3] || '—',
    day: s[4] || '—',
    from: s[5] || '—',
    to: s[6] || '—',
    place: s[7] || '—',
    units: s[8] != null ? s[8] : 0
  };
}
/* =========================================================
   ساخت صفحه‌بندی
   ========================================================= */
function buildPagination(container, currentPage, totalPages, onPageChange) {
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  /**
   * ساخت یه دکمه صفحه
   */
  function makeButton(label, pageNumber, options) {
    options = options || {};
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-button';
    btn.textContent = label;

    if (options.active) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }
    if (options.disabled) {
      btn.disabled = true;
    }
    if (options.ariaLabel) {
      btn.setAttribute('aria-label', options.ariaLabel);
    }
    if (!options.disabled && !options.active && pageNumber != null) {
      btn.addEventListener('click', function () {
        onPageChange(pageNumber);
      });
    }

    container.appendChild(btn);
    return btn;
  }

  /**
   * ساخت سه‌نقطه (...)
   */
  function makeEllipsis() {
    var span = document.createElement('span');
    span.className = 'page-ellipsis';
    span.textContent = '…';
    span.setAttribute('aria-hidden', 'true');
    container.appendChild(span);
  }

  /* دکمه صفحه قبلی */
  makeButton('→', currentPage - 1, {
    disabled: currentPage === 1,
    ariaLabel: 'صفحه قبلی'
  });

  /* محاسبه صفحات نمایش داده‌شده */
  var pages = [];
  var delta = 1;

  if (totalPages <= 7) {
    for (var i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    var left = Math.max(2, currentPage - delta);
    var right = Math.min(totalPages - 1, currentPage + delta);

    if (currentPage <= 4) {
      left = 2;
      right = 5;
    } else if (currentPage >= totalPages - 3) {
      left = totalPages - 4;
      right = totalPages - 1;
    }

    for (var j = left; j <= right; j++) pages.push(j);
    pages.push(totalPages);
  }

  /* رندر صفحات + سه‌نقطه‌ها */
  var lastRendered = 0;
  pages.forEach(function (p) {
    if (lastRendered && p - lastRendered > 1) makeEllipsis();
    makeButton(toPersianDigits(p), p, {
      active: p === currentPage,
      ariaLabel: 'صفحه ' + p
    });
    lastRendered = p;
  });

  /* دکمه صفحه بعدی */
  makeButton('←', currentPage + 1, {
    disabled: currentPage === totalPages,
    ariaLabel: 'صفحه بعدی'
  });
}


/* =========================================================
   ۱) منوی موبایل
   ========================================================= */
function initMobileMenu() {
  var header = document.querySelector('.site-header');
  var toggleButton = document.querySelector('.mobile-menu-button');
  if (!header || !toggleButton) return;

  var navLinks = header.querySelectorAll('.nav-link');

  function openMenu() {
    header.classList.add('nav-open');
    toggleButton.classList.add('is-active');
    toggleButton.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    header.classList.remove('nav-open');
    toggleButton.classList.remove('is-active');
    toggleButton.setAttribute('aria-expanded', 'false');
  }

  function isMenuOpen() {
    return header.classList.contains('nav-open');
  }

  toggleButton.addEventListener('click', function (event) {
    event.stopPropagation();
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /* بستن منو با کلیک بیرون */
  document.addEventListener('click', function (event) {
    if (!isMenuOpen()) return;
    if (!header.contains(event.target)) closeMenu();
  });

  /* بستن منو با Esc */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      closeMenu();
      toggleButton.focus();
    }
  });

  /* بستن منو با تغییر اندازه صفحه */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && isMenuOpen()) closeMenu();
  });
}

function initProfessorCarousel() {
  var track = document.querySelector('.professor-grid');
  var prevButton = document.querySelector('.carousel-button-prev');
  var nextButton = document.querySelector('.carousel-button-next');
  var dots = document.querySelectorAll('.carousel-dot');

  if (!track || !prevButton || !nextButton || dots.length === 0) return;

  var cards = Array.prototype.slice.call(track.children);
  if (cards.length === 0) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getVisibleCount() {
    var width = window.innerWidth;
    if (width <= 768) return 1;
    if (width <= 992) return 2;
    return 4;
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(cards.length / getVisibleCount()));
  }

  function getCurrentPage() {
    var pageCount = getPageCount();
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return 0;
    /* توی RTL، scrollLeft منفیه — قدرمطلق می‌گیریم */
    var scrollLeftAbs = Math.abs(track.scrollLeft);
    var ratio = scrollLeftAbs / maxScroll;
    var page = Math.round(ratio * (pageCount - 1));
    return Math.min(Math.max(page, 0), pageCount - 1);
  }

  function scrollToPage(pageIndex) {
    var pageCount = getPageCount();
    pageIndex = Math.min(Math.max(pageIndex, 0), pageCount - 1);
    var maxScroll = track.scrollWidth - track.clientWidth;
    var targetScroll = pageCount <= 1 ? 0 : (maxScroll * pageIndex) / (pageCount - 1);
    /* توی RTL، scrollLeft منفیه */
    track.scrollTo({
      left: -targetScroll,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  function updateUI() {
    var pageCount = getPageCount();
    var currentPage = getCurrentPage();
    var maxScroll = track.scrollWidth - track.clientWidth;
    var scrollLeftAbs = Math.abs(track.scrollLeft);

    dots.forEach(function (dot, index) {
      var isActivePage = index === currentPage && index < pageCount;
      dot.classList.toggle('active', isActivePage);
      dot.style.display = index < pageCount ? '' : 'none';
    });

    prevButton.disabled = scrollLeftAbs <= 1;
    nextButton.disabled = scrollLeftAbs >= maxScroll - 1;
  }

  prevButton.addEventListener('click', function () {
    scrollToPage(getCurrentPage() - 1);
  });

  nextButton.addEventListener('click', function () {
    scrollToPage(getCurrentPage() + 1);
  });

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      scrollToPage(index);
    });
  });

  var scrollTimeout;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateUI, 80);
  });

  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') scrollToPage(getCurrentPage() + 1);
    else if (event.key === 'ArrowRight') scrollToPage(getCurrentPage() - 1);
  });

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateUI, 150);
  });

  updateUI();
}

/* =========================================================
   ۳) فیلتر و صفحه‌بندی اساتید (professors.html)
   ========================================================= */
function initProfessorsFilter() {
  var searchInput      = document.getElementById('professor-search');
  var departmentSelect = document.getElementById('professor-department');
  var sortSelect       = document.getElementById('professor-sort');
  var grid             = document.getElementById('professors-grid');
  var resultsNumber    = document.getElementById('professors-results-number');
  var emptyState       = document.getElementById('professors-empty-state');
  var pagination       = document.getElementById('professors-pagination');

  if (!searchInput || !grid) return;

  var professors = buildProfessorsFromSections();
  updateSavedBadge();

  var perPage = 12;
  var currentPage = 1;

  /**
   * ساخت یه کارت استاد
   */
  function buildProfessorCard(p) {
    var isSaved = isProfessorSaved(p.id);
    return '' +
      '<article class="professor-card">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-professor-id="' + p.id + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره استاد') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<a href="professor.html?id=' + p.id + '" class="professor-card-link" aria-label="مشاهده صفحه استاد">' +
          '<div class="professor-image-wrapper">' +
            '<img src="images/professor-placeholder-' + p.id + '.jpg" alt="تصویر استاد" class="professor-image">' +
          '</div>' +
          '<div class="professor-info">' +
            '<h3 class="professor-name">' + escapeHtml(p.name) + '</h3>' +
            '<p class="professor-field">' + escapeHtml(p.field) + '</p>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  /**
   * اعمال فیلترها و صفحه‌بندی
   */
  function applyFilters(resetPage) {
    if (resetPage !== false) currentPage = 1;

    var query      = normalizeDigits(searchInput.value.trim().toLowerCase());
    var department = departmentSelect ? departmentSelect.value : '';

    /* فیلتر */
    var matched = professors.filter(function (p) {
      var inName  = normalizeDigits(p.name).toLowerCase().indexOf(query) !== -1;
      var inField = normalizeDigits(p.field).toLowerCase().indexOf(query) !== -1;
      var matchesQuery = (query === '') || inName || inField;

      var matchesDept = !department ||
        (department === 'کامپیوتر' && p.field === 'مهندسی کامپیوتر') ||
        (department === 'برق' && p.field === 'مهندسی برق');

      return matchesQuery && matchesDept;
    });

    /* مرتب‌سازی الفبایی */
    matched.sort(function (a, b) {
      return a.name.localeCompare(b.name, 'fa');
    });

    /* صفحه‌بندی */
    var totalPages = Math.ceil(matched.length / perPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * perPage;
    var pageItems = matched.slice(start, start + perPage);

    /* رندر */
    grid.innerHTML = pageItems.map(buildProfessorCard).join('');
    if (resultsNumber) resultsNumber.textContent = toPersianDigits(matched.length);
    if (emptyState) emptyState.hidden = matched.length !== 0;

    /* صفحه‌بندی */
    buildPagination(pagination, currentPage, totalPages, function (newPage) {
      currentPage = newPage;
      applyFilters(false);
      var section = grid.closest('section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* کلیک روی دکمه ذخیره استاد - Event Delegation */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn) return;
    if (!btn.dataset.professorId) return;
    e.preventDefault();
    e.stopPropagation();

    var id = parseInt(btn.dataset.professorId, 10);
    if (isNaN(id)) return;

    var nowSaved = toggleProfessorSaved(id);
    btn.classList.toggle('is-saved', nowSaved);
    btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره استاد');

    var iconEl = btn.querySelector('.save-icon');
    if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

    updateSavedBadge();
  });

  /* رویدادها */
  searchInput.addEventListener('input', function () { applyFilters(true); });
  if (departmentSelect) departmentSelect.addEventListener('change', function () { applyFilters(true); });
  if (sortSelect) sortSelect.addEventListener('change', function () { applyFilters(true); });

  var form = document.getElementById('professors-filter-form');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

  applyFilters(true);
}


/* =========================================================
   ۴) فیلتر و صفحه‌بندی دروس (Courses.html)
   ========================================================= */
function initCoursesFilter() {
  var searchInput      = document.getElementById('course-search');
  var departmentSelect = document.getElementById('course-department');
  var sortSelect       = document.getElementById('course-sort');
  var grid             = document.getElementById('courses-grid');
  var resultsNumber    = document.getElementById('courses-results-number');
  var emptyState       = document.getElementById('courses-empty-state');
  var pagination       = document.getElementById('courses-pagination');

  if (!searchInput || !grid) return;

  var sections = (typeof SECTIONS_DATA !== 'undefined')
    ? SECTIONS_DATA.filter(function (s) { return s && s.length; })
    : [];

  updateSavedBadge();

  var perPage = 12;
  var currentPage = 1;

  /**
   * ساخت یه کارت درس
   */
  function buildCourseCard(s) {
    var o = toSectionObj(s);
    var timeText = (o.from !== '—' && o.to !== '—') ? (o.from + ' تا ' + o.to) : '—';
    var savedKey = o.code + '|' + o.section;
    var isSaved = isCourseSaved(savedKey);
    var courseUrl = 'course.html?code=' + encodeURIComponent(o.code);

    return '' +
      '<article class="course-card course-card-full">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-course-code="' + escapeHtml(savedKey) + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<div class="course-icon" aria-hidden="true">📚</div>' +
        '<div class="course-info">' +
          '<span class="course-code">' + escapeHtml(o.code) + '</span>' +
          '<h3><a href="' + courseUrl + '" class="professor-course-link">' + escapeHtml(o.name) + '</a></h3>' +
          '<p>کد ارائه کلاس: ' + escapeHtml(o.section) + '</p>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>👨‍🏫 ' + escapeHtml(o.prof) + '</span>' +
          '<span class="course-meta-units">' + toPersianDigits(o.units) + ' واحد</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📅 ' + escapeHtml(o.day) + '</span>' +
          '<span>🕐 ' + escapeHtml(timeText) + '</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📍 ' + escapeHtml(o.place) + '</span>' +
        '</div>' +
      '</article>';
  }

  /**
   * اعمال فیلترها و صفحه‌بندی
   */
  function applyFilters(resetPage) {
    if (resetPage !== false) currentPage = 1;

    var query      = normalizeDigits(searchInput.value.trim().toLowerCase());
    var department = departmentSelect ? departmentSelect.value : '';
    var sortBy     = sortSelect ? sortSelect.value : 'name-asc';

    /* فیلتر */
    var matched = sections.filter(function (s) {
      if (query === '') return true;
      var o = toSectionObj(s);
      return normalizeDigits(o.name).toLowerCase().indexOf(query) !== -1 ||
             normalizeDigits(o.code).toLowerCase().indexOf(query) !== -1 ||
             normalizeDigits(o.section).toLowerCase().indexOf(query) !== -1 ||
             normalizeDigits(o.prof).toLowerCase().indexOf(query) !== -1;
    });

    /* فیلتر گروه آموزشی: چون داده گروه ندارد، «برق» خالی می‌شود */
    if (department === 'برق') matched = [];

    /* مرتب‌سازی */
    matched.sort(function (a, b) {
      var oa = toSectionObj(a);
      var ob = toSectionObj(b);

      if (sortBy === 'units-desc') {
        return (ob.units - oa.units) || oa.name.localeCompare(ob.name, 'fa');
      }
      if (sortBy === 'units-asc') {
        return (oa.units - ob.units) || oa.name.localeCompare(ob.name, 'fa');
      }
      return oa.name.localeCompare(ob.name, 'fa');
    });

    /* صفحه‌بندی */
    var totalPages = Math.ceil(matched.length / perPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * perPage;
    var pageItems = matched.slice(start, start + perPage);

    /* رندر */
    grid.innerHTML = pageItems.map(buildCourseCard).join('');
    if (resultsNumber) resultsNumber.textContent = toPersianDigits(matched.length);
    if (emptyState) emptyState.hidden = matched.length !== 0;

    /* صفحه‌بندی */
    buildPagination(pagination, currentPage, totalPages, function (newPage) {
      currentPage = newPage;
      applyFilters(false);
      var section = grid.closest('section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* کلیک روی دکمه ذخیره درس - Event Delegation */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn) return;
    if (!btn.dataset.courseCode) return;
    e.preventDefault();
    e.stopPropagation();

    var code = btn.dataset.courseCode;
    if (!code) return;

    var nowSaved = toggleCourseSaved(code);
    btn.classList.toggle('is-saved', nowSaved);
    btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس');

    var iconEl = btn.querySelector('.save-icon');
    if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

    updateSavedBadge();
  });

  /* رویدادها */
  searchInput.addEventListener('input', function () { applyFilters(true); });
  if (departmentSelect) departmentSelect.addEventListener('change', function () { applyFilters(true); });
  if (sortSelect) sortSelect.addEventListener('change', function () { applyFilters(true); });

  var form = document.getElementById('courses-filter-form');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

  applyFilters(true);
}

/* =========================================================
   ۵) فرم‌های ورود و ثبت‌نام
   ========================================================= */
function initAuthForms() {
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var identity = document.getElementById('login-identity');
      var password = document.getElementById('login-password');
      if (!identity || !password) return;

      if (!/^\d{5,}$/.test(identity.value.trim())) {
        showToast('شماره دانشجویی را به‌درستی وارد کن (فقط عدد).', 'error');
        identity.focus();
        return;
      }
      if (password.value.length < 6) {
        showToast('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
        password.focus();
        return;
      }

      showToast('ورود موفق! (نمایشی)', 'success');
    });
  }

  var registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var name        = document.getElementById('register-name');
      var studentId   = document.getElementById('register-student-id');
      var email       = document.getElementById('register-email');
      var department  = document.getElementById('register-department');
      var password    = document.getElementById('register-password');
      var confirm     = document.getElementById('register-confirm');

      if (!name || !studentId || !password || !confirm) return;

      if (name.value.trim().length < 3) {
        showToast('نام و نام خانوادگی را کامل وارد کن.', 'error');
        name.focus();
        return;
      }
      if (!/^\d{5,}$/.test(studentId.value.trim())) {
        showToast('شماره دانشجویی را به‌درستی وارد کن (فقط عدد).', 'error');
        studentId.focus();
        return;
      }
      if (email && email.value.trim() !== '') {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
          showToast('ایمیل را به‌درستی وارد کن یا خالی بگذار.', 'error');
          email.focus();
          return;
        }
      }
      if (department && department.value === '') {
        showToast('گروه آموزشی را انتخاب کن.', 'error');
        department.focus();
        return;
      }
      if (password.value.length < 6) {
        showToast('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
        password.focus();
        return;
      }
      if (password.value !== confirm.value) {
        showToast('رمز عبور و تکرار آن یکسان نیستند.', 'error');
        confirm.focus();
        return;
      }

      openTermsModal();
    });
  }
}


/* =========================================================
   مودال قوانین و شرایط
   ========================================================= */
function openTermsModal() {
  var overlay = document.getElementById('terms-modal-overlay');
  if (!overlay) return;

  var closeButton   = document.getElementById('terms-modal-close');
  var cancelButton  = document.getElementById('terms-modal-cancel');
  var confirmButton = document.getElementById('terms-modal-confirm');
  var agreeInput    = document.getElementById('terms-modal-agree-input');
  var agreeLabel    = document.getElementById('terms-modal-agree-label');
  var registerForm  = document.getElementById('register-form');

  agreeInput.checked = false;
  agreeLabel.classList.remove('is-checked');
  confirmButton.disabled = true;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  function updateConfirmState() {
    confirmButton.disabled = !agreeInput.checked;
    agreeLabel.classList.toggle('is-checked', agreeInput.checked);
  }

  function closeTermsModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    var newOverlay = overlay.cloneNode(true);
    overlay.parentNode.replaceChild(newOverlay, overlay);
  }

  function confirmTerms() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    setTimeout(function () {
      showToast('حساب کاربری با موفقیت ساخته شد! (نمایشی)', 'success');
      if (registerForm) registerForm.reset();
    }, 100);
  }

  agreeInput.addEventListener('change', updateConfirmState);

  agreeLabel.addEventListener('click', function (event) {
    if (event.target === agreeInput) return;
    event.preventDefault();
    agreeInput.checked = !agreeInput.checked;
    updateConfirmState();
  });

  closeButton.addEventListener('click', closeTermsModal);
  cancelButton.addEventListener('click', closeTermsModal);

  confirmButton.addEventListener('click', function () {
    if (!confirmButton.disabled) confirmTerms();
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeTermsModal();
  });

  var escHandler = function (event) {
    if (event.key === 'Escape' && !overlay.hidden) {
      closeTermsModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}


/* =========================================================
   ۶) نوار پیشرفت اسکرول
   ========================================================= */
function initScrollProgress() {
  if (document.querySelector('.scroll-progress')) return;

  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  function update() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = percent + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* =========================================================
   ۷) انیمیشن ورود کارت‌ها (Scroll Reveal)
   ========================================================= */
function initScrollReveal() {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  var targets = document.querySelectorAll(
    '.feature-card, .professor-card, .course-card, .course-card-full, ' +
    '.about-step-card, .about-value-card, .about-visual-card, ' +
    '.review-card, .about-creator-card, .legal-block'
  );
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  targets.forEach(function (el) {
    el.classList.add('reveal-on-scroll');
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach(function (el) { observer.observe(el); });
}


/* =========================================================
   ۸) افکت Tilt (کج شدن کارت با موس)
   ========================================================= */
function initCardTilt() {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  if (window.matchMedia('(hover: none)').matches) return;

  var cards = document.querySelectorAll('.popular-professors-section .professor-card');

  cards.forEach(function (card) {
    var maxTilt = 8;

    card.addEventListener('mousemove', function (event) {
      var rect = card.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var midX = rect.width / 2;
      var midY = rect.height / 2;
      var rotateY = ((x - midX) / midX) * maxTilt;
      var rotateX = ((midY - y) / midY) * maxTilt;
      card.style.transform =
        'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
}


/* =========================================================
   ۹) افکت Ripple (موج روی دکمه‌ها)
   ========================================================= */
function initRipple() {
  var buttons = document.querySelectorAll(
    '.auth-button, .search-button, .cta-button, .header-register, ' +
    '.page-button, .professor-action-btn, .feature-link, .quick-link'
  );

  buttons.forEach(function (btn) {
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';

    btn.addEventListener('click', function (event) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x = event.clientX - rect.left - size / 2;
      var y = event.clientY - rect.top - size / 2;

      var ripple = document.createElement('span');
      ripple.className = 'ripple-wave';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 700);
    });
  });
}


/* =========================================================
   ۱۰) دکمه «برو بالا»
   ========================================================= */
function initBackToTop() {
  if (document.querySelector('.back-to-top')) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'برو به بالای صفحه');
  btn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(btn);

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function update() {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* =========================================================
   ۱۱) ستاره‌های انیمیشنی
   ========================================================= */
function initStarAnimation() {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  document.querySelectorAll('.rating-stars').forEach(function (star) {
    star.classList.add('stars-animated');
  });
}


/* =========================================================
   صفحه شماره‌های تماس
   ========================================================= */
function initContactsPage() {
  var searchInput   = document.getElementById('contact-search');
  var grid          = document.getElementById('contacts-grid');
  var resultsNumber = document.getElementById('contacts-results-number');
  var emptyState    = document.getElementById('contacts-empty-state');

  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.contact-card'));

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim().toLowerCase();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = (card.dataset.search || '').toLowerCase();
        var isVisible = query === '' || text.indexOf(query) !== -1;
        card.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount += 1;
      });

      if (resultsNumber) resultsNumber.textContent = toPersianDigits(visibleCount);
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
  }

  /* دکمه‌های کپی شماره */
  var copyButtons = grid.querySelectorAll('.contact-copy-btn');
  copyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var number = btn.dataset.copyBtn;
      copyToClipboard(number).then(function () {
        var originalHTML = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = '<span aria-hidden="true">✓</span>';
        setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.innerHTML = originalHTML;
        }, 1500);
      });
    });
  });
}


/* =========================================================
   کپی کردن متن در کلیپ‌بورد
   ========================================================= */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  /* Fallback برای مرورگرهای قدیمی */
  return new Promise(function (resolve, reject) {
    try {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/* =========================================================
   صفحه جستجو
   ========================================================= */
function initSearchPage() {
  var input = document.getElementById('search-page-input');
  if (!input) return;

  var professorsData = buildProfessorsFromSections();
  var sectionsData   = (typeof SECTIONS_DATA !== 'undefined')
    ? SECTIONS_DATA.filter(function (s) { return s && s.length; })
    : [];

  var form       = document.getElementById('search-page-form');
  var tabProf    = document.getElementById('tab-professors');
  var tabCour    = document.getElementById('tab-courses');
  var countProf  = document.getElementById('tab-count-professors');
  var countCour  = document.getElementById('tab-count-courses');
  var gridProf   = document.getElementById('search-professors-grid');
  var gridCour   = document.getElementById('search-courses-grid');
  var panelProf  = document.getElementById('results-professors');
  var panelCour  = document.getElementById('results-courses');
  var emptyBox   = document.getElementById('search-empty');
  var hintBox    = document.getElementById('search-hint');
  var summaryBox = document.getElementById('search-summary');
  var currentTab = 'professors';

  /**
   * ساخت کارت استاد
   */
  function buildProfessorCard(p) {
    var isSaved = isProfessorSaved(p.id);
    return '' +
      '<article class="professor-card">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-professor-id="' + p.id + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره استاد') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<a href="professor.html?id=' + p.id + '" class="professor-card-link" aria-label="مشاهده صفحه استاد">' +
          '<div class="professor-image-wrapper">' +
            '<img src="images/professor-placeholder-' + p.id + '.jpg" alt="تصویر استاد" class="professor-image">' +
          '</div>' +
          '<div class="professor-info">' +
            '<h3 class="professor-name">' + escapeHtml(p.name) + '</h3>' +
            '<p class="professor-field">' + escapeHtml(p.field) + '</p>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  /**
   * ساخت کارت درس
   */
  function buildCourseCard(s) {
    var o = toSectionObj(s);
    var timeText = (o.from !== '—' && o.to !== '—') ? (o.from + ' تا ' + o.to) : '—';
    var savedKey = o.code + '|' + o.section;
    var isSaved = isCourseSaved(savedKey);
    var courseUrl = 'course.html?code=' + encodeURIComponent(o.code);

    return '' +
      '<article class="course-card course-card-full">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-course-code="' + escapeHtml(savedKey) + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<div class="course-icon" aria-hidden="true">📚</div>' +
        '<div class="course-info">' +
          '<span class="course-code">' + escapeHtml(o.code) + '</span>' +
          '<h3><a href="' + courseUrl + '" class="professor-course-link">' + escapeHtml(o.name) + '</a></h3>' +
          '<p>کد ارائه کلاس: ' + escapeHtml(o.section) + '</p>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>👨‍🏫 ' + escapeHtml(o.prof) + '</span>' +
          '<span class="course-meta-units">' + toPersianDigits(o.units) + ' واحد</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📅 ' + escapeHtml(o.day) + '</span>' +
          '<span>🕐 ' + escapeHtml(timeText) + '</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📍 ' + escapeHtml(o.place) + '</span>' +
        '</div>' +
      '</article>';
  }

  /**
   * اجرای جستجو
   */
  function runSearch(query) {
    query = normalizeDigits((query || '').trim().toLowerCase());

    var matchedProf = [];
    var matchedCour = [];

    if (query !== '') {
      matchedProf = professorsData.filter(function (p) {
        return normalizeDigits(p.name).toLowerCase().indexOf(query) !== -1 ||
               normalizeDigits(p.field).toLowerCase().indexOf(query) !== -1;
      });

      matchedCour = sectionsData.filter(function (s) {
        var o = toSectionObj(s);
        return normalizeDigits(o.name).toLowerCase().indexOf(query) !== -1 ||
               normalizeDigits(o.code).toLowerCase().indexOf(query) !== -1 ||
               normalizeDigits(o.section).toLowerCase().indexOf(query) !== -1 ||
               normalizeDigits(o.prof).toLowerCase().indexOf(query) !== -1;
      });
    }

    countProf.textContent = toPersianDigits(matchedProf.length);
    countCour.textContent = toPersianDigits(matchedCour.length);

    var total = matchedProf.length + matchedCour.length;

    /* حالت خالی (کاربر چیزی تایپ نکرده) */
    if (query === '') {
      hintBox.hidden = false;
      emptyBox.hidden = true;
      summaryBox.hidden = true;
      gridProf.innerHTML = '';
      gridCour.innerHTML = '';
      return;
    }

    hintBox.hidden = true;
    summaryBox.hidden = false;
    summaryBox.innerHTML =
      'برای عبارت <em>' + escapeHtml(query) + '</em> ' +
      '<strong>' + toPersianDigits(total) + '</strong> نتیجه پیدا شد.';

    /* اگه نتیجه‌ای نبود */
    if (total === 0) {
      emptyBox.hidden = false;
      gridProf.innerHTML = '';
      gridCour.innerHTML = '';
      return;
    }

    emptyBox.hidden = true;

    /* رندر نتایج (حداکثر ۶۰ درس برای عملکرد بهتر) */
    var courToShow = matchedCour.slice(0, 60);
    gridProf.innerHTML = matchedProf.map(buildProfessorCard).join('');
    gridCour.innerHTML = courToShow.map(buildCourseCard).join('');

    /* سوییچ خودکار بین تب‌ها اگه یکی خالی بود */
    if (currentTab === 'professors' && matchedProf.length === 0 && matchedCour.length > 0) {
      switchTab('courses');
    } else if (currentTab === 'courses' && matchedCour.length === 0 && matchedProf.length > 0) {
      switchTab('professors');
    }
  }

  /**
   * سوییچ بین تب استادها و درس‌ها
   */
  function switchTab(tab) {
    currentTab = tab;
    var isProf = (tab === 'professors');

    tabProf.classList.toggle('active', isProf);
    tabCour.classList.toggle('active', !isProf);
    tabProf.setAttribute('aria-selected', isProf ? 'true' : 'false');
    tabCour.setAttribute('aria-selected', !isProf ? 'true' : 'false');

    panelProf.hidden = !isProf;
    panelCour.hidden = isProf;
  }

  /* کلیک روی دکمه ذخیره استاد */
  gridProf.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn || !btn.dataset.professorId) return;
    e.preventDefault();
    e.stopPropagation();

    var id = parseInt(btn.dataset.professorId, 10);
    if (isNaN(id)) return;

    var nowSaved = toggleProfessorSaved(id);
    btn.classList.toggle('is-saved', nowSaved);
    btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره استاد');

    var iconEl = btn.querySelector('.save-icon');
    if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

    updateSavedBadge();
  });

  /* کلیک روی دکمه ذخیره درس */
  gridCour.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn || !btn.dataset.courseCode) return;
    e.preventDefault();
    e.stopPropagation();

    var code = btn.dataset.courseCode;
    if (!code) return;

    var nowSaved = toggleCourseSaved(code);
    btn.classList.toggle('is-saved', nowSaved);
    btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس');

    var iconEl = btn.querySelector('.save-icon');
    if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

    updateSavedBadge();
  });

  tabProf.addEventListener('click', function () { switchTab('professors'); });
  tabCour.addEventListener('click', function () { switchTab('courses'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runSearch(input.value);

    var newUrl = window.location.pathname +
      (input.value.trim() ? '?q=' + encodeURIComponent(input.value.trim()) : '');
    history.replaceState(null, '', newUrl);
  });

  input.addEventListener('input', function () {
    runSearch(input.value);
  });

  /* خوندن پارامتر q از URL */
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get('q') || '';
  if (initialQuery) {
    input.value = initialQuery;
    runSearch(initialQuery);
  }
}


/* =========================================================
   صفحه تجربه دانشجویان
   ========================================================= */
function initReviewsPage() {
  var grid = document.getElementById('reviews-grid');
  if (!grid) return;

  var emptyState = document.getElementById('reviews-empty-state');
  var reviewsData = []; /* فعلاً خالی — بعداً با بک‌اند پر می‌شه */

  if (reviewsData.length === 0) {
    grid.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;
  grid.hidden = false;
}


/* =========================================================
   نمایش پیام Toast
   ========================================================= */
function showToast(message, type) {
  type = type || 'info';

  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  var icons = { error: '⚠️', success: '✓', info: 'ℹ️' };

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.setAttribute('role', 'status');

  var iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icons[type] || icons.info;

  var msgEl = document.createElement('span');
  msgEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(msgEl);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('is-leaving');
    setTimeout(function () {
      toast.remove();
      if (container.children.length === 0) container.remove();
    }, 300);
  }, 3500);
}


/* =========================================================
   چشم نمایش/پنهان رمز عبور
   ========================================================= */
function initPasswordToggles() {
  var toggles = document.querySelectorAll('.password-toggle');

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.dataset.target;
      var input = document.getElementById(targetId);
      if (!input) return;

      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      btn.classList.toggle('is-visible', isPassword);
      btn.setAttribute('aria-label', isPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
      btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');

      var iconEl = btn.querySelector('.password-toggle-icon');
      if (iconEl) iconEl.textContent = isPassword ? '🙈' : '👁';

      input.focus();
    });
  });
}


/* =========================================================
   صفحه پروفایل استاد
   ========================================================= */
function initProfessorProfile() {
  var nameEl = document.getElementById('professor-name');
  if (!nameEl) return;

  var params = new URLSearchParams(window.location.search);
  var id     = parseInt(params.get('id'), 10);

  var professors = buildProfessorsFromSections();
  var professor  = null;

  for (var i = 0; i < professors.length; i++) {
    if (professors[i].id === id) {
      professor = professors[i];
      break;
    }
  }

  if (!professor) {
    nameEl.textContent = 'استاد پیدا نشد';
    var fieldEl = document.getElementById('professor-field');
    if (fieldEl) fieldEl.textContent = 'شناسه اشتباه است';
    return;
  }

  /* دکمه ذخیره استاد */
  var saveBtn = document.getElementById('professor-profile-save-btn');
  if (saveBtn) {
    saveBtn.hidden = false;

    (function () {
      function updateSaveBtn() {
        var isSaved = isProfessorSaved(professor.id);
        saveBtn.classList.toggle('is-saved', isSaved);

        var iconEl  = saveBtn.querySelector('.save-icon');
        var labelEl = saveBtn.querySelector('.save-label');

        if (iconEl)  iconEl.textContent  = isSaved ? '✅' : '＋';
        if (labelEl) labelEl.textContent = isSaved ? 'ذخیره شده' : 'ذخیره استاد';

        saveBtn.setAttribute('aria-label', isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره استاد');
      }

      updateSaveBtn();

      saveBtn.addEventListener('click', function () {
        toggleProfessorSaved(professor.id);
        updateSaveBtn();
        updateSavedBadge();
      });
        })();
  }

  initProfessorTabs(professor);

  /* اطلاعات استاد */
  nameEl.textContent = professor.name;
  document.title = professor.name + ' | پارسورا';

    /* درباره استاد (بیوگرافی) */
  initProfessorAbout(professor);

  var fieldEl2 = document.getElementById('professor-field');
  if (fieldEl2) fieldEl2.textContent = professor.field;

  /* کلاس‌های استاد */
  var sections = SECTIONS_DATA.filter(function (s) {
    return s && s[3] === professor.name;
  });

  var grid  = document.getElementById('professor-courses-grid');
  var empty = document.getElementById('professor-courses-empty');

  if (!sections.length) {
    if (empty) empty.hidden = false;
    return;
  }

  function buildSectionCard(s) {
    var o = toSectionObj(s);
    var timeText = (o.from !== '—' && o.to !== '—') ? (o.from + ' تا ' + o.to) : '—';
    var codeForUrl = encodeURIComponent(o.code);
    var savedKey = o.code + '|' + o.section;
    var isSaved = isCourseSaved(savedKey);

    return '' +
      '<article class="course-card course-card-full">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-course-code="' + escapeHtml(savedKey) + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<div class="course-icon" aria-hidden="true">📚</div>' +
        '<div class="course-info">' +
          '<span class="course-code">' + escapeHtml(o.code) + '</span>' +
          '<h3>' +
            '<a href="course.html?code=' + codeForUrl + '" class="professor-course-link">' +
              escapeHtml(o.name) +
            '</a>' +
          '</h3>' +
          '<p>کد ارائه کلاس: ' + escapeHtml(o.section) + '</p>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📅 ' + escapeHtml(o.day) + '</span>' +
          '<span class="course-meta-units">' + toPersianDigits(o.units) + ' واحد</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>🕐 ' + escapeHtml(timeText) + '</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📍 ' + escapeHtml(o.place) + '</span>' +
        '</div>' +
      '</article>';
  }

  if (grid) {
    grid.innerHTML = sections.map(buildSectionCard).join('');

    /* Delegation برای دکمه ذخیره درس */
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.professor-save-btn');
      if (!btn || !btn.dataset.courseCode) return;
      e.preventDefault();
      e.stopPropagation();

      var code = btn.dataset.courseCode;
      var nowSaved = toggleCourseSaved(code);

      btn.classList.toggle('is-saved', nowSaved);
      btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس');

      var iconEl = btn.querySelector('.save-icon');
      if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

      updateSavedBadge();
    });
  }
}


/* =========================================================
   صفحه اصلی
   ========================================================= */
/* =========================================================
   صفحه اصلی — اساتید محبوب
   ========================================================= */
function initIndexPage() {
  var profGrid = document.getElementById('index-professor-grid');
  if (!profGrid || typeof SECTIONS_DATA === 'undefined') return;

  /* اساتید محبوب — به ترتیب نمایش */
  var POPULAR_PROFESSORS = [
    'زهره فتوحی',
    'شهروز مسیح',
    'زینب کمالی',
    'نرگس بدری',
    'راحله محمدزاده',
    'پروا صادقی علویجه',
    'الهه دری دولت آبادی',
    'فرشته امیری میالجردی'
  ];

  var allProfessors = buildProfessorsFromSections();

  /* پیدا کردن هر استاد محبوب از لیست کل */
  var professors = [];
  POPULAR_PROFESSORS.forEach(function (name) {
    for (var i = 0; i < allProfessors.length; i++) {
      if (allProfessors[i].name === name) {
        professors.push(allProfessors[i]);
        break;
      }
    }
  });

  /* اگه استادی پیدا نشد، فقط لاگ کن (برای دیباگ) */
  if (professors.length !== POPULAR_PROFESSORS.length) {
    POPULAR_PROFESSORS.forEach(function (name) {
      var found = allProfessors.some(function (p) { return p.name === name; });
      if (!found) {
        console.warn('استاد محبوب پیدا نشد: ' + name);
      }
    });
  }

  profGrid.innerHTML = professors.map(function (p) {
    return '' +
      '<article class="professor-card">' +
        '<a href="professor.html?id=' + p.id + '" class="professor-card-link" aria-label="مشاهده صفحه استاد">' +
          '<div class="professor-image-wrapper">' +
            '<img src="images/professor-placeholder-' + p.id + '.jpg" alt="تصویر استاد" class="professor-image">' +
          '</div>' +
          '<div class="professor-info">' +
            '<h3 class="professor-name">' + escapeHtml(p.name) + '</h3>' +
            '<p class="professor-field">' + escapeHtml(p.field) + '</p>' +
          '</div>' +
        '</a>' +
      '</article>';
  }).join('');
}

/* =========================================================
   صفحه پروفایل درس
   ========================================================= */
function initCoursePage() {
  var nameEl = document.getElementById('course-name');
  if (!nameEl) return;

  var params = new URLSearchParams(window.location.search);
  var code = normalizeDigits(params.get('code') || '');

  if (!code) {
    nameEl.textContent = 'درس پیدا نشد';
    var codeEl0 = document.getElementById('course-code');
    if (codeEl0) codeEl0.textContent = 'کد درس داده نشده';
    return;
  }

  var sections = (typeof SECTIONS_DATA !== 'undefined')
    ? SECTIONS_DATA.filter(function (s) {
        return s && s.length && normalizeDigits(s[1]) === code;
      })
    : [];

  if (!sections.length) {
    nameEl.textContent = 'درس پیدا نشد';
    var codeEl1 = document.getElementById('course-code');
    if (codeEl1) codeEl1.textContent = 'کد: ' + code;
    var empty1 = document.getElementById('course-sections-empty');
    if (empty1) empty1.hidden = false;
    return;
  }

  var courseName = sections[0][0];
  nameEl.textContent = courseName;
  document.title = courseName + ' | پارسورا';

  var codeEl2 = document.getElementById('course-code');
  if (codeEl2) codeEl2.textContent = 'کد درس: ' + code;

  function buildSectionCard(s) {
    var o = toSectionObj(s);
    var timeText = (o.from !== '—' && o.to !== '—') ? (o.from + ' تا ' + o.to) : '—';
    var savedKey = o.code + '|' + o.section;
    var isSaved = isCourseSaved(savedKey);

    return '' +
      '<article class="course-card course-card-full">' +
        '<button type="button" class="professor-save-btn' + (isSaved ? ' is-saved' : '') + '" ' +
          'data-course-code="' + escapeHtml(savedKey) + '" ' +
          'aria-label="' + (isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس') + '">' +
          '<span class="save-icon" aria-hidden="true">' + (isSaved ? '✅' : '＋') + '</span>' +
        '</button>' +
        '<div class="course-icon" aria-hidden="true">📚</div>' +
        '<div class="course-info">' +
          '<span class="course-code">' + escapeHtml(o.code) + '</span>' +
          '<h3>' + escapeHtml(o.name) + '</h3>' +
          '<p>کد ارائه کلاس: ' + escapeHtml(o.section) + '</p>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>👨‍🏫 ' + escapeHtml(o.prof) + '</span>' +
          '<span class="course-meta-units">' + toPersianDigits(o.units) + ' واحد</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📅 ' + escapeHtml(o.day) + '</span>' +
          '<span>🕐 ' + escapeHtml(timeText) + '</span>' +
        '</div>' +
        '<div class="course-meta-row">' +
          '<span>📍 ' + escapeHtml(o.place) + '</span>' +
        '</div>' +
      '</article>';
  }

  var grid = document.getElementById('course-sections-grid');
  if (grid) {
    grid.innerHTML = sections.map(buildSectionCard).join('');

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.professor-save-btn');
      if (!btn || !btn.dataset.courseCode) return;
      e.preventDefault();
      e.stopPropagation();

      var code2 = btn.dataset.courseCode;
      var nowSaved = toggleCourseSaved(code2);

      btn.classList.toggle('is-saved', nowSaved);
      btn.setAttribute('aria-label', nowSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره درس');

      var iconEl = btn.querySelector('.save-icon');
      if (iconEl) iconEl.textContent = nowSaved ? '✅' : '＋';

      updateSavedBadge();
    });
  }
}


/* =========================================================
   صفحه درس‌های ذخیره‌شده
   ========================================================= */
function initSavedCoursesPage() {
  var courGrid   = document.getElementById('saved-courses-grid');
  var empty      = document.getElementById('saved-empty-state');
  var clearBtn   = document.getElementById('saved-clear-btn');
  var resultsNum = document.getElementById('saved-results-number');

  if (!courGrid) return;

  function render() {
    var savedKeys = getSavedCourses();
    var allSections = (typeof SECTIONS_DATA !== 'undefined')
      ? SECTIONS_DATA.filter(function (s) { return s && s.length; })
      : [];

    /* فیلتر بر اساس کددرس|کدسکشن */
    var savedCourses = allSections.filter(function (s) {
      var key = s[1] + '|' + s[2];
      return savedKeys.indexOf(key) !== -1;
    });

    if (resultsNum) resultsNum.textContent = toPersianDigits(savedCourses.length);

    if (savedCourses.length === 0) {
      courGrid.innerHTML = '';
      courGrid.hidden = true;
      if (empty) empty.hidden = false;
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    courGrid.hidden = false;
    if (empty) empty.hidden = true;
    if (clearBtn) clearBtn.hidden = false;

    courGrid.innerHTML = savedCourses.map(function (s) {
      var courseCode  = s[1];
      var sectionCode = s[2];
      var name        = s[0];
      var prof        = s[3];
      var day         = s[4] || '—';
      var timeFrom    = s[5] || '—';
      var timeTo      = s[6] || '—';
      var place       = s[7] || '—';
      var units       = s[8] != null ? s[8] : 0;
      var timeText    = (timeFrom !== '—' && timeTo !== '—')
        ? (timeFrom + ' تا ' + timeTo)
        : '—';
      var savedKey    = courseCode + '|' + sectionCode;
      var courseUrl   = 'course.html?code=' + encodeURIComponent(courseCode);

      return '' +
        '<article class="course-card course-card-full">' +
          '<button type="button" class="professor-save-btn is-saved" ' +
            'data-course-code="' + escapeHtml(savedKey) + '" ' +
            'aria-label="حذف از ذخیره‌شده‌ها">' +
            '<span class="save-icon" aria-hidden="true">✅</span>' +
          '</button>' +
          '<div class="course-icon" aria-hidden="true">📚</div>' +
          '<div class="course-info">' +
            '<span class="course-code">' + escapeHtml(courseCode) + '</span>' +
            '<h3><a href="' + courseUrl + '" class="professor-course-link">' + escapeHtml(name) + '</a></h3>' +
            '<p>کد ارائه کلاس: ' + escapeHtml(sectionCode) + '</p>' +
          '</div>' +
          '<div class="course-meta-row">' +
            '<span>👨‍🏫 ' + escapeHtml(prof) + '</span>' +
            '<span class="course-meta-units">' + toPersianDigits(units) + ' واحد</span>' +
          '</div>' +
          '<div class="course-meta-row">' +
            '<span>📅 ' + escapeHtml(day) + '</span>' +
            '<span>🕐 ' + escapeHtml(timeText) + '</span>' +
          '</div>' +
          '<div class="course-meta-row">' +
            '<span>📍 ' + escapeHtml(place) + '</span>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* حذف درس */
  courGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn || !btn.dataset.courseCode) return;
    e.preventDefault();
    e.stopPropagation();

    toggleCourseSaved(btn.dataset.courseCode);
    render();
    updateSavedBadge();
  });

  /* پاک کردن همه */
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!confirm('همه‌ی درس‌های ذخیره‌شده پاک بشن؟')) return;
      try { localStorage.removeItem(SAVED_COURSES_KEY); } catch (e) {}
      render();
      updateSavedBadge();
    });
  }

  render();
  updateSavedBadge();
}


/* =========================================================
   صفحه استادهای ذخیره‌شده
   ========================================================= */
function initSavedPage() {
  var profGrid   = document.getElementById('saved-professors-grid');
  var empty      = document.getElementById('saved-empty-state');
  var clearBtn   = document.getElementById('saved-clear-btn');
  var resultsNum = document.getElementById('saved-results-number');
  var group      = document.getElementById('saved-professors-group');

  if (!profGrid) return;

  function render() {
    var savedProfIds = getSavedProfessors();
    var allProfs = buildProfessorsFromSections();

    var savedProfs = allProfs.filter(function (p) {
      return savedProfIds.indexOf(p.id) !== -1;
    });

    if (resultsNum) resultsNum.textContent = toPersianDigits(savedProfs.length);

    if (savedProfs.length === 0) {
      profGrid.innerHTML = '';
      profGrid.hidden = true;
      if (group) group.hidden = true;
      if (empty) empty.hidden = false;
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    profGrid.hidden = false;
    if (group) group.hidden = false;
    if (empty) empty.hidden = true;
    if (clearBtn) clearBtn.hidden = false;

    profGrid.innerHTML = savedProfs.map(function (p) {
      return '' +
        '<article class="professor-card">' +
          '<button type="button" class="professor-save-btn is-saved" ' +
            'data-professor-id="' + p.id + '" ' +
            'aria-label="حذف از ذخیره‌شده‌ها">' +
            '<span class="save-icon" aria-hidden="true">✅</span>' +
          '</button>' +
          '<a href="professor.html?id=' + p.id + '" class="professor-card-link" aria-label="مشاهده صفحه استاد">' +
            '<div class="professor-image-wrapper">' +
              '<img src="images/professor-placeholder-' + p.id + '.jpg" alt="تصویر استاد" class="professor-image">' +
            '</div>' +
            '<div class="professor-info">' +
              '<h3 class="professor-name">' + escapeHtml(p.name) + '</h3>' +
              '<p class="professor-field">' + escapeHtml(p.field) + '</p>' +
            '</div>' +
          '</a>' +
        '</article>';
    }).join('');
  }

  /* حذف استاد */
  profGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.professor-save-btn');
    if (!btn || !btn.dataset.professorId) return;
    e.preventDefault();
    e.stopPropagation();

    var id = parseInt(btn.dataset.professorId, 10);
    if (isNaN(id)) return;

    toggleProfessorSaved(id);
    render();
    updateSavedBadge();
  });

  /* پاک کردن همه */
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!confirm('همه‌ی استادهای ذخیره‌شده پاک بشن؟')) return;
      try { localStorage.removeItem(SAVED_PROFESSORS_KEY); } catch (e) {}
      render();
      updateSavedBadge();
    });
  }

  render();
  updateSavedBadge();
}


/* =========================================================
   دکمه حالت شب/روز
   ========================================================= */
function initThemeToggle() {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  var currentTheme = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';

  btn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', currentTheme === 'dark' ? 'حالت روز' : 'حالت شب');

  btn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      /* سوییچ به روز */
      document.documentElement.removeAttribute('data-theme');
      btn.innerHTML = '🌙';
      btn.setAttribute('aria-label', 'حالت شب');
      try { localStorage.setItem('parsoora_theme', 'light'); } catch (e) {}
    } else {
      /* سوییچ به شب */
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.innerHTML = '☀️';
      btn.setAttribute('aria-label', 'حالت روز');
      try { localStorage.setItem('parsoora_theme', 'dark'); } catch (e) {}
    }
  });
}
/* =========================================================
   تب‌های پروفایل استاد
   ========================================================= */
function initProfessorTabs(professor) {
  var tabCourses  = document.getElementById('tab-courses');
  var tabReviews  = document.getElementById('tab-reviews');
  var panelCourses = document.getElementById('panel-courses');
  var panelReviews = document.getElementById('panel-reviews');

  if (!tabCourses || !tabReviews) return;

  function switchTab(tabName) {
    var isCourses = tabName === 'courses';

    tabCourses.classList.toggle('active', isCourses);
    tabReviews.classList.toggle('active', !isCourses);
    tabCourses.setAttribute('aria-selected', isCourses ? 'true' : 'false');
    tabReviews.setAttribute('aria-selected', !isCourses ? 'true' : 'false');

    panelCourses.hidden = !isCourses;
    panelReviews.hidden = isCourses;
  }

  tabCourses.addEventListener('click', function () { switchTab('courses'); });
  tabReviews.addEventListener('click', function () { switchTab('reviews'); });

  initProfessorReviews(professor);
}


/* =========================================================
   نظرات استاد (نمایشی)
   ========================================================= */
function initProfessorReviews(professor) {
  var addBtn       = document.getElementById('reviews-add-btn');
  var form         = document.getElementById('review-form');
  var formClose    = document.getElementById('review-form-close');
  var formCancel   = document.getElementById('review-form-cancel');
  var starsBox     = document.getElementById('review-form-stars');
  var starsHint    = document.getElementById('review-stars-hint');
  var listBox      = document.getElementById('reviews-list');
  var avgEl        = document.getElementById('reviews-average');
  var countEl      = document.getElementById('reviews-count');

  if (!addBtn || !form) return;

  var sampleReviews = [
    {
      name: 'سارا محمدی',
      initials: 'س.م',
      rating: 5,
      date: 'دو هفته پیش',
      text: 'استاد واقعاً خوبی هستن. تدریسشون واضح و منظمه و همیشه با حوصله جواب سؤالا رو می‌دن. کلاس‌هاشون رو از دست ندادم.'
    },
    {
      name: 'محمد حسینی',
      initials: 'م.ح',
      rating: 4,
      date: 'یک ماه پیش',
      text: 'تدریسشون خوبه ولی حجم مطالب یکم زیاده. امتحان‌هاشون منصفانه‌ست و نمره‌ی پایان‌ترم خوب می‌دن.'
    },
    {
      name: 'نگار کریمی',
      initials: 'ن.ک',
      rating: 5,
      date: '۲ ماه پیش',
      text: 'یکی از بهترین استادهایی هستن که تا حالا داشتم. با دانشجوها خیلی مهربونن و به پروژه‌ها اهمیت می‌دن.'
    }
  ];

  var selectedRating = 0;
  var starButtons = starsBox ? starsBox.querySelectorAll('.review-star') : [];

  function updateStars(rating) {
    starButtons.forEach(function (btn) {
      var val = parseInt(btn.dataset.value, 10);
      btn.classList.toggle('is-active', val <= rating);
    });

    if (starsHint) {
      var hints = {
        0: 'روی ستاره‌ها کلیک کن',
        1: 'خیلی ضعیف',
        2: 'ضعیف',
        3: 'متوسط',
        4: 'خوب',
        5: 'عالی'
      };
      starsHint.textContent = hints[rating] || '';
    }
  }

  starButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedRating = parseInt(btn.dataset.value, 10);
      updateStars(selectedRating);
    });
  });

  function renderReviews() {
    if (!listBox) return;

    if (sampleReviews.length === 0) {
      listBox.innerHTML = '' +
        '<div class="reviews-empty">' +
          '<span class="reviews-empty-icon">💬</span>' +
          '<h3>هنوز نظری ثبت نشده</h3>' +
          '<p>اولین نفری باش که تجربه‌ات رو به اشتراک می‌ذاره.</p>' +
        '</div>';
      if (avgEl) avgEl.textContent = '—';
      if (countEl) countEl.textContent = 'هنوز نظری نیست';
      return;
    }

    var totalRating = 0;
    sampleReviews.forEach(function (r) { totalRating += r.rating; });
    var avg = totalRating / sampleReviews.length;

    if (avgEl) {
      avgEl.textContent = toPersianDigits(avg.toFixed(1));
    }
    if (countEl) {
      countEl.textContent = 'بر اساس ' + toPersianDigits(sampleReviews.length) + ' نظر';
    }

    var summaryStars = document.querySelector('.reviews-summary-stars');
    if (summaryStars) {
      var fullStars = Math.round(avg);
      summaryStars.textContent = '⭐'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    }

    listBox.innerHTML = sampleReviews.map(function (r) {
      var stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return '' +
        '<article class="review-item">' +
          '<div class="review-item-header">' +
            '<div class="review-item-avatar">' + escapeHtml(r.initials) + '</div>' +
            '<div class="review-item-info">' +
              '<div class="review-item-name">' + escapeHtml(r.name) + '</div>' +
              '<div class="review-item-date">' + escapeHtml(r.date) + '</div>' +
            '</div>' +
            '<div class="review-item-stars" aria-label="امتیاز ' + r.rating + ' از ۵">' + stars + '</div>' +
          '</div>' +
          '<p class="review-item-text">' + escapeHtml(r.text) + '</p>' +
        '</article>';
    }).join('');
  }

  renderReviews();

  function openForm() {
    form.hidden = false;
    var nameInput = document.getElementById('review-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 100);
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeForm() {
    form.hidden = true;
    form.reset();
    selectedRating = 0;
    updateStars(0);
  }

  addBtn.addEventListener('click', openForm);
  if (formClose) formClose.addEventListener('click', closeForm);
  if (formCancel) formCancel.addEventListener('click', closeForm);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = document.getElementById('review-name');
    var text = document.getElementById('review-text');

    if (!name.value.trim() || name.value.trim().length < 3) {
      showToast('نامت را کامل وارد کن.', 'error');
      name.focus();
      return;
    }
    if (!selectedRating) {
      showToast('لطفاً امتیازت را انتخاب کن.', 'error');
      return;
    }
    if (!text.value.trim() || text.value.trim().length < 10) {
      showToast('متن نظرت باید حداقل ۱۰ کاراکتر باشد.', 'error');
      text.focus();
      return;
    }

    sampleReviews.unshift({
      name: name.value.trim(),
      initials: name.value.trim().split(' ').map(function (w) { return w.charAt(0); }).join('.'),
      rating: selectedRating,
      date: 'همین حالا',
      text: text.value.trim()
    });

    renderReviews();
    closeForm();
    showToast('نظرت ثبت شد و پس از تأیید منتشر می‌شه. ممنون! 🙏', 'success');
  });
}
/* =========================================================
   بخش «درباره استاد» توی پروفایل
   ========================================================= */
function initProfessorAbout(professor) {
  var section = document.getElementById('professor-about-section');
  var textEl  = document.getElementById('professor-about-text');

  if (!section || !textEl) return;

  /* اگه bios.js لود نشده یا استاد بیوگرافی نداره → مخفی بمونه */
  if (typeof PROFESSOR_BIOS === 'undefined') return;

  var bio = PROFESSOR_BIOS[professor.name];
  if (!bio || bio.trim() === '') return;

  textEl.textContent = bio.trim();
  section.hidden = false;
}