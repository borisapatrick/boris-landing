// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// Close mobile nav when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (navToggle) navToggle.classList.remove('active');
    if (navLinks) navLinks.classList.remove('active');
  });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Contact Form Validation & Handling
// Dual submission: Firestore (for admin dashboard) + Netlify Forms (for backup/email notifications)
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  var isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Toggle email required star when email consent checkbox changes
  var emailConsentCb = document.getElementById('email-consent');
  var emailRequiredStar = document.getElementById('emailRequiredStar');
  if (emailConsentCb && emailRequiredStar) {
    emailConsentCb.addEventListener('change', function() {
      emailRequiredStar.style.display = this.checked ? 'inline' : 'none';
    });
  }

  contactForm.addEventListener('submit', async function(e) {
    // ALWAYS prevent native form POST — we handle submission via JS
    e.preventDefault();

    var firstName = document.getElementById('first-name');
    var lastName = document.getElementById('last-name');
    var phone = document.getElementById('phone');
    var submitBtn = contactForm.querySelector('button[type="submit"]');

    // Reset any previous error styling
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(function(el) {
      el.style.borderColor = '#DDD';
    });
    var prevConsentError = document.querySelector('.consent-error');
    if (prevConsentError) prevConsentError.remove();

    // Validate first name
    if (!firstName.value.trim()) {
      firstName.style.borderColor = '#CC1A1A';
      firstName.focus();
      return;
    }

    // Validate last name
    if (!lastName.value.trim()) {
      lastName.style.borderColor = '#CC1A1A';
      lastName.focus();
      return;
    }

    // Validate phone (at least 7 digits)
    var phoneDigits = phone.value.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      phone.style.borderColor = '#CC1A1A';
      phone.focus();
      return;
    }

    // Validate email if email consent is checked
    var contactEmail = document.getElementById('contact-email');
    var emailConsentChecked = document.getElementById('email-consent') && document.getElementById('email-consent').checked;
    if (emailConsentChecked && contactEmail && !contactEmail.value.trim()) {
      contactEmail.style.borderColor = '#CC1A1A';
      contactEmail.focus();
      return;
    }
    if (contactEmail && contactEmail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value.trim())) {
      contactEmail.style.borderColor = '#CC1A1A';
      contactEmail.focus();
      return;
    }

    // Validate required consent checkboxes (ToS required; at least one of SMS/Email required; Marketing optional)
    var tosConsent = document.getElementById('tos-consent');
    var smsConsent = document.getElementById('sms-consent');
    var emailConsent = document.getElementById('email-consent');
    var consentGroup = document.querySelector('.consent-group--multi');

    // Remove any previous consent error messages
    var existingErrors = document.querySelectorAll('.consent-error');
    existingErrors.forEach(function(el) { el.remove(); });

    var missingConsents = [];
    if (tosConsent && !tosConsent.checked) missingConsents.push('Terms of Service and Privacy Policy');
    var hasSmsOrEmail = (smsConsent && smsConsent.checked) || (emailConsent && emailConsent.checked);
    if (!hasSmsOrEmail) missingConsents.push('at least one communication method (SMS or Email)');

    if (missingConsents.length > 0) {
      var errorMsg = document.createElement('span');
      errorMsg.className = 'consent-error';
      errorMsg.style.color = '#CC1A1A';
      errorMsg.style.fontSize = '0.85rem';
      errorMsg.style.display = 'block';
      errorMsg.style.marginTop = '4px';
      errorMsg.textContent = 'Please agree to the following to continue: ' + missingConsents.join(', ') + '.';
      if (consentGroup) consentGroup.appendChild(errorMsg);
      if (tosConsent && !tosConsent.checked) { tosConsent.focus(); }
      else if (!hasSmsOrEmail && smsConsent) { smsConsent.focus(); }
      return;
    }

    // Wrap everything after validation in try/catch so the user is never left stuck
    try {
      // Collect form data for Firestore
      var formData = {
        name: firstName.value.trim() + ' ' + lastName.value.trim(),
        email: document.getElementById('contact-email') ? document.getElementById('contact-email').value.trim() : '',
        phone: phone.value.trim(),
        year: document.getElementById('year').value.trim(),
        make: document.getElementById('make').value.trim(),
        model: document.getElementById('model').value.trim(),
        licensePlate: document.getElementById('license-plate').value.trim(),
        preferredDate: document.getElementById('preferred-date').value ||
                       (document.getElementById('asap') && document.getElementById('asap').checked ? 'ASAP' : ''),
        callbackTime: document.getElementById('callback-time') ? document.getElementById('callback-time').value : '',
        message: document.getElementById('message').value.trim(),
        smsConsent: document.getElementById('sms-consent') ? document.getElementById('sms-consent').checked : false,
        emailConsent: document.getElementById('email-consent') ? document.getElementById('email-consent').checked : false,
        marketingConsent: document.getElementById('marketing-consent') ? document.getElementById('marketing-consent').checked : false
      };

      // Show loading state
      if (submitBtn) {
        submitBtn.textContent = 'SENDING...';
        submitBtn.disabled = true;
      }

      // Step 1: Save to Firestore (logged-in → appointments, guest → guest_appointments)
      // Wrapped in its own try/catch so Firestore errors never block submission
      try {
        if (typeof auth !== 'undefined' && auth.currentUser && typeof saveAppointmentToFirestore === 'function') {
          await saveAppointmentToFirestore(formData);
        } else if (typeof saveGuestAppointmentToFirestore === 'function') {
          await saveGuestAppointmentToFirestore(formData);
        } else {
          console.warn('Firestore save functions not available — skipping Firestore save');
        }
      } catch (firestoreErr) {
        // Firestore save failed — log it but don't block the user
        console.error('Firestore save failed:', firestoreErr);
      }

      // Step 2: Submit the form natively for Netlify Forms (or redirect on localhost)
      if (isLocalhost) {
        // On localhost, Netlify POST will 501 — just redirect via JS
        // Firestore save already succeeded (or failed gracefully) above
        window.location.href = 'thank-you.html';
      } else {
        // On production (Netlify): submit the form natively
        // form.submit() on the DOM element does NOT re-trigger the 'submit' event listener,
        // so it goes straight to the native POST which Netlify handles + redirects to thank-you.html
        contactForm.submit();
      }
    } catch (err) {
      // Something unexpected failed after validation — still redirect/submit so user isn't stuck
      console.error('Form handler error:', err);
      if (isLocalhost) {
        window.location.href = 'thank-you.html';
      } else {
        contactForm.submit();
      }
    }
  });
}

// Field Hint Tooltip Toggle (mobile-friendly)
document.querySelectorAll('.field-hint-wrapper').forEach(wrapper => {
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('active');
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.field-hint-wrapper.active').forEach(wrapper => {
    wrapper.classList.remove('active');
  });
});

// Custom Calendar Picker
(function() {
  const dateInput = document.getElementById('preferred-date');
  const calendarPopup = document.getElementById('calendarPopup');
  const asapCheckbox = document.getElementById('asap');

  if (!dateInput || !calendarPopup) return;

  let currentMonth = new Date();
  let selectedDate = null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    let html = '<div class="calendar-header">';
    html += '<button type="button" class="calendar-prev">&lsaquo;</button>';
    html += '<span class="calendar-month">' + monthNames[month] + ' ' + year + '</span>';
    html += '<button type="button" class="calendar-next">&rsaquo;</button>';
    html += '</div>';
    html += '<div class="calendar-grid">';

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(d => { html += '<span class="day-label">' + d + '</span>'; });

    for (let i = 0; i < firstDay; i++) {
      html += '<span class="day empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0,0,0,0);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = date < today;
      const isTooFar = date > maxDate;
      const isDisabled = isWeekend || isPast || isTooFar;
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

      let classes = 'day';
      if (isDisabled) classes += ' disabled';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';

      html += '<span class="' + classes + '" data-date="' + year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0') + '">' + d + '</span>';
    }

    html += '</div>';
    calendarPopup.innerHTML = html;

    // Navigation
    calendarPopup.querySelector('.calendar-prev').addEventListener('click', function(e) {
      e.stopPropagation();
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      renderCalendar();
    });
    calendarPopup.querySelector('.calendar-next').addEventListener('click', function(e) {
      e.stopPropagation();
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      renderCalendar();
    });

    // Day selection
    calendarPopup.querySelectorAll('.day:not(.disabled):not(.empty)').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        const parts = el.dataset.date.split('-');
        selectedDate = new Date(parts[0], parts[1]-1, parts[2]);
        selectedDate.setHours(0,0,0,0);
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        dateInput.value = selectedDate.toLocaleDateString('en-US', options);
        if (asapCheckbox) asapCheckbox.checked = false;
        calendarPopup.classList.remove('active');
      });
    });
  }

  // Toggle calendar
  dateInput.addEventListener('click', function(e) {
    e.stopPropagation();
    if (dateInput.disabled) return;
    currentMonth = selectedDate ? new Date(selectedDate) : new Date();
    renderCalendar();
    calendarPopup.classList.toggle('active');
  });

  // Close when clicking outside
  document.addEventListener('click', function() {
    calendarPopup.classList.remove('active');
  });

  calendarPopup.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // ASAP toggle
  if (asapCheckbox) {
    asapCheckbox.addEventListener('change', function() {
      if (asapCheckbox.checked) {
        dateInput.value = '';
        dateInput.disabled = true;
        selectedDate = null;
        calendarPopup.classList.remove('active');
      } else {
        dateInput.disabled = false;
      }
    });
  }
})();

// Gallery Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.querySelector('.lightbox-close');

if (lightbox) {
  // Open lightbox when clicking gallery images
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('active');
    });
  });

  // Close lightbox
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
    }
  });
}
