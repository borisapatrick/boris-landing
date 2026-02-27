# Separate Opt-In Consent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single bundled consent checkbox with 4 separate checkboxes (ToS, SMS, Email, Marketing) across all forms, update Firestore schema, and update the dashboard profile toggles.

**Architecture:** Each consent type gets its own checkbox, stored as individual boolean + timestamp fields in Firestore. ToS/SMS/Email are required on forms; Marketing is optional. Signup forms never pre-fill checkboxes. The contact form pre-fills SMS/Email/Marketing for logged-in users based on stored preferences. The dashboard profile shows 3 toggles (SMS, Email, Marketing) for managing preferences.

**Tech Stack:** Vanilla HTML/CSS/JS, Firebase Firestore

---

### Task 1: Update Contact Form Checkboxes (index.html)

**Files:**
- Modify: `index.html:216-221` (consent checkbox)
- Modify: `index.html:239-254` (consent modal)

**Step 1: Replace single checkbox with 4 checkboxes**

Replace lines 216-221 in `index.html`:

```html
          <div class="form-group consent-group">
            <label class="consent-label">
              <input type="checkbox" id="sms-consent" name="sms_consent" value="yes" required>
              <span>I agree to receive communications from Boris Enterprises.<span class="required-star">*</span> <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('consentModal').style.display='flex';">Details</a></span>
            </label>
          </div>
```

With:

```html
          <div class="form-group consent-group consent-group--multi">
            <p class="consent-heading">Communications Preferences <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('consentModal').style.display='flex';">Details</a></p>
            <label class="consent-label">
              <input type="checkbox" id="tos-consent" name="tos_consent" value="yes">
              <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a><span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="sms-consent" name="sms_consent" value="yes">
              <span>I consent to receive appointment reminders and updates via SMS<span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="email-consent" name="email_consent" value="yes">
              <span>I consent to receive appointment reminders and updates via email<span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="marketing-consent" name="marketing_consent" value="yes">
              <span>I'd like to receive promotional offers and service specials</span>
            </label>
          </div>
```

**Step 2: Update consent modal content**

Replace lines 239-254 in `index.html`:

```html
  <div id="consentModal" class="consent-modal-overlay" onclick="this.style.display='none';">
    <div class="consent-modal-card" onclick="event.stopPropagation();">
      <button type="button" class="consent-modal-close" onclick="document.getElementById('consentModal').style.display='none';">&times;</button>
      <h3 class="consent-modal-title">Communications Consent</h3>
      <div class="consent-modal-body">
        <p>By checking this box, you agree to receive communications from Boris Enterprises, including:</p>
        <ul>
          <li>Appointment confirmations, updates, and reminders via SMS and email</li>
          <li>Service recommendations and follow-ups</li>
          <li>Promotional offers and seasonal specials</li>
          <li>Important notices about your vehicle</li>
        </ul>
      </div>
      <p class="consent-modal-note">Message and data rates may apply for SMS. You can opt out at any time by contacting us at <a href="tel:2316750723">231-675-0723</a> or replying STOP to any text message.</p>
    </div>
  </div>
```

With:

```html
  <div id="consentModal" class="consent-modal-overlay" onclick="this.style.display='none';">
    <div class="consent-modal-card" onclick="event.stopPropagation();">
      <button type="button" class="consent-modal-close" onclick="document.getElementById('consentModal').style.display='none';">&times;</button>
      <h3 class="consent-modal-title">Communications Consent</h3>
      <div class="consent-modal-body">
        <p><strong>SMS Reminders</strong> — We'll text you appointment confirmations, reminders, and updates about your vehicle's service status.</p>
        <p><strong>Email Reminders</strong> — We'll email you appointment confirmations, reminders, and updates about your vehicle's service status.</p>
        <p><strong>Promotional Offers</strong> (optional) — Occasional service specials, seasonal promotions, and maintenance recommendations.</p>
      </div>
      <p class="consent-modal-note">Message and data rates may apply for SMS. You can opt out at any time by contacting us at <a href="tel:2316750723">231-675-0723</a> or replying STOP to any text message. You can update your preferences from your account dashboard.</p>
    </div>
  </div>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: replace single consent checkbox with 4 separate opt-ins on contact form"
```

---

### Task 2: Update Contact Form Validation (js/main.js)

**Files:**
- Modify: `js/main.js:76-94` (consent validation)

**Step 1: Replace single consent validation with multi-checkbox validation**

Replace lines 76-94 in `js/main.js`:

```javascript
    // Validate communications consent checkbox
    var smsConsent = document.getElementById('sms-consent');
    if (smsConsent && !smsConsent.checked) {
      // Remove any previous consent error message
      var existingError = document.querySelector('.consent-error');
      if (existingError) existingError.remove();
      // Show error message below the consent group
      var consentGroup = smsConsent.closest('.form-group');
      var errorMsg = document.createElement('span');
      errorMsg.className = 'consent-error';
      errorMsg.style.color = '#CC1A1A';
      errorMsg.style.fontSize = '0.85rem';
      errorMsg.style.display = 'block';
      errorMsg.style.marginTop = '4px';
      errorMsg.textContent = 'Please agree to receive communications to continue.';
      consentGroup.appendChild(errorMsg);
      smsConsent.focus();
      return;
    }
```

With:

```javascript
    // Validate required consent checkboxes (ToS, SMS, Email are required; Marketing is optional)
    var tosConsent = document.getElementById('tos-consent');
    var smsConsent = document.getElementById('sms-consent');
    var emailConsent = document.getElementById('email-consent');
    var consentGroup = document.querySelector('.consent-group--multi');

    // Remove any previous consent error messages
    var existingErrors = document.querySelectorAll('.consent-error');
    existingErrors.forEach(function(el) { el.remove(); });

    var missingConsents = [];
    if (tosConsent && !tosConsent.checked) missingConsents.push('Terms of Service and Privacy Policy');
    if (smsConsent && !smsConsent.checked) missingConsents.push('SMS reminders');
    if (emailConsent && !emailConsent.checked) missingConsents.push('Email reminders');

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
      else if (smsConsent && !smsConsent.checked) { smsConsent.focus(); }
      else if (emailConsent && !emailConsent.checked) { emailConsent.focus(); }
      return;
    }
```

**Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: validate 3 required consent checkboxes on contact form"
```

---

### Task 3: Update Guest Appointment Firestore Save (js/auth.js)

**Files:**
- Modify: `js/auth.js:590-604` (saveGuestAppointmentToFirestore)

**Step 1: Add consent fields to guest appointment data**

Replace lines 590-604 in `js/auth.js`:

```javascript
  window.saveGuestAppointmentToFirestore = function(formData) {
    return db.collection('guest_appointments').add({
      name: formData.name || '',
      phone: formData.phone || '',
      vehicleYear: formData.year || '',
      vehicleMake: formData.make || '',
      vehicleModel: formData.model || '',
      licensePlate: formData.licensePlate || '',
      preferredDate: formData.preferredDate || 'ASAP',
      message: formData.message || '',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  };
```

With:

```javascript
  window.saveGuestAppointmentToFirestore = function(formData) {
    return db.collection('guest_appointments').add({
      name: formData.name || '',
      phone: formData.phone || '',
      vehicleYear: formData.year || '',
      vehicleMake: formData.make || '',
      vehicleModel: formData.model || '',
      licensePlate: formData.licensePlate || '',
      preferredDate: formData.preferredDate || 'ASAP',
      message: formData.message || '',
      smsConsent: !!formData.smsConsent,
      emailConsent: !!formData.emailConsent,
      marketingConsent: !!formData.marketingConsent,
      consentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  };
```

**Step 2: Update formData collection in main.js to include consent values**

In `js/main.js`, after line 108 (inside the formData object, around line 99-109), add the consent fields. Replace the formData block:

```javascript
      var formData = {
        name: firstName.value.trim() + ' ' + lastName.value.trim(),
        phone: phone.value.trim(),
        year: document.getElementById('year').value.trim(),
        make: document.getElementById('make').value.trim(),
        model: document.getElementById('model').value.trim(),
        licensePlate: document.getElementById('license-plate').value.trim(),
        preferredDate: document.getElementById('preferred-date').value ||
                       (document.getElementById('asap') && document.getElementById('asap').checked ? 'ASAP' : ''),
        message: document.getElementById('message').value.trim()
      };
```

With:

```javascript
      var formData = {
        name: firstName.value.trim() + ' ' + lastName.value.trim(),
        phone: phone.value.trim(),
        year: document.getElementById('year').value.trim(),
        make: document.getElementById('make').value.trim(),
        model: document.getElementById('model').value.trim(),
        licensePlate: document.getElementById('license-plate').value.trim(),
        preferredDate: document.getElementById('preferred-date').value ||
                       (document.getElementById('asap') && document.getElementById('asap').checked ? 'ASAP' : ''),
        message: document.getElementById('message').value.trim(),
        smsConsent: document.getElementById('sms-consent') ? document.getElementById('sms-consent').checked : false,
        emailConsent: document.getElementById('email-consent') ? document.getElementById('email-consent').checked : false,
        marketingConsent: document.getElementById('marketing-consent') ? document.getElementById('marketing-consent').checked : false
      };
```

**Step 3: Commit**

```bash
git add js/auth.js js/main.js
git commit -m "feat: store consent fields in guest appointments and pass from form"
```

---

### Task 4: Update Contact Form Pre-fill for Logged-in Users (js/auth.js)

**Files:**
- Modify: `js/auth.js:527-537` (prefillContactForm consent section)

**Step 1: Update pre-fill to handle separate consent fields**

Replace lines 527-537 in `js/auth.js`:

```javascript
        // Hide consent checkbox if user already consented
        if (data.smsConsent === true) {
          var consentCheckbox = document.getElementById('sms-consent');
          var consentGroup = consentCheckbox ? consentCheckbox.closest('.consent-group') : null;
          if (consentGroup) {
            consentGroup.style.display = 'none';
          }
          if (consentCheckbox) {
            consentCheckbox.checked = true;
          }
        }
```

With:

```javascript
        // Pre-fill consent checkboxes based on stored preferences
        // ToS is always pre-checked for logged-in users (they accepted at signup)
        var tosCheckbox = document.getElementById('tos-consent');
        if (tosCheckbox) tosCheckbox.checked = true;

        var smsCheckbox = document.getElementById('sms-consent');
        if (smsCheckbox && data.smsConsent === true) smsCheckbox.checked = true;

        var emailCheckbox = document.getElementById('email-consent');
        if (emailCheckbox && data.emailConsent === true) emailCheckbox.checked = true;

        var marketingCheckbox = document.getElementById('marketing-consent');
        if (marketingCheckbox && data.marketingConsent === true) marketingCheckbox.checked = true;
```

**Step 2: Commit**

```bash
git add js/auth.js
git commit -m "feat: pre-fill separate consent checkboxes for logged-in users on contact form"
```

---

### Task 5: Update Signup Form Checkboxes (login.html)

**Files:**
- Modify: `login.html:127-132` (signup consent checkbox)
- Modify: `login.html:71-77` (Google consent checkbox on signup tab)
- Modify: `login.html:168-183` (signup consent modal)

**Step 1: Replace signup form single checkbox with 4 checkboxes**

Replace lines 127-132 in `login.html`:

```html
            <div class="form-group consent-group">
              <label class="consent-label">
                <input type="checkbox" id="signupSmsConsent" name="sms_consent" value="yes" required>
                <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a>, and consent to receive communications from Boris Enterprises.<span class="required-star">*</span> <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('signupConsentModal').style.display='flex';">Details</a></span>
              </label>
            </div>
```

With:

```html
            <div class="form-group consent-group consent-group--multi">
              <p class="consent-heading">Communications Preferences <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('signupConsentModal').style.display='flex';">Details</a></p>
              <label class="consent-label">
                <input type="checkbox" id="signupTosConsent" name="tos_consent" value="yes">
                <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a><span class="required-star">*</span></span>
              </label>
              <label class="consent-label">
                <input type="checkbox" id="signupSmsConsent" name="sms_consent" value="yes">
                <span>I consent to receive appointment reminders and updates via SMS<span class="required-star">*</span></span>
              </label>
              <label class="consent-label">
                <input type="checkbox" id="signupEmailConsent" name="email_consent" value="yes">
                <span>I consent to receive appointment reminders and updates via email<span class="required-star">*</span></span>
              </label>
              <label class="consent-label">
                <input type="checkbox" id="signupMarketingConsent" name="marketing_consent" value="yes">
                <span>I'd like to receive promotional offers and service specials</span>
              </label>
            </div>
```

**Step 2: Replace Google consent checkbox on signup tab**

Replace lines 71-77 in `login.html`:

```html
          <div class="form-group consent-group" id="googleConsentGroup" style="display: none;">
            <label class="consent-label">
              <input type="checkbox" id="google-consent-checkbox" name="google_sms_consent" value="yes" required>
              <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a>, and consent to receive communications from Boris Enterprises.<span class="required-star">*</span> <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('signupConsentModal').style.display='flex';">Details</a></span>
            </label>
          </div>
```

With:

```html
          <div class="form-group consent-group consent-group--multi" id="googleConsentGroup" style="display: none;">
            <p class="consent-heading">Communications Preferences <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('signupConsentModal').style.display='flex';">Details</a></p>
            <label class="consent-label">
              <input type="checkbox" id="googleTosConsent" name="google_tos_consent" value="yes">
              <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a><span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="googleSmsConsent" name="google_sms_consent" value="yes">
              <span>I consent to receive appointment reminders and updates via SMS<span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="googleEmailConsent" name="google_email_consent" value="yes">
              <span>I consent to receive appointment reminders and updates via email<span class="required-star">*</span></span>
            </label>
            <label class="consent-label">
              <input type="checkbox" id="googleMarketingConsent" name="google_marketing_consent" value="yes">
              <span>I'd like to receive promotional offers and service specials</span>
            </label>
          </div>
```

**Step 3: Update signup consent modal content**

Replace lines 168-183 in `login.html`:

```html
  <div id="signupConsentModal" class="consent-modal-overlay" onclick="this.style.display='none';">
    <div class="consent-modal-card" onclick="event.stopPropagation();">
      <button type="button" class="consent-modal-close" onclick="document.getElementById('signupConsentModal').style.display='none';">&times;</button>
      <h3 class="consent-modal-title">Communications Consent</h3>
      <div class="consent-modal-body">
        <p>By checking this box, you agree to receive communications from Boris Enterprises, including:</p>
        <ul>
          <li>Appointment confirmations, updates, and reminders via SMS and email</li>
          <li>Service recommendations and follow-ups</li>
          <li>Promotional offers and seasonal specials</li>
          <li>Important notices about your vehicle</li>
        </ul>
      </div>
      <p class="consent-modal-note">Message and data rates may apply for SMS. You can opt out at any time by contacting us at <a href="tel:2316750723">231-675-0723</a> or replying STOP to any text message.</p>
    </div>
  </div>
```

With:

```html
  <div id="signupConsentModal" class="consent-modal-overlay" onclick="this.style.display='none';">
    <div class="consent-modal-card" onclick="event.stopPropagation();">
      <button type="button" class="consent-modal-close" onclick="document.getElementById('signupConsentModal').style.display='none';">&times;</button>
      <h3 class="consent-modal-title">Communications Consent</h3>
      <div class="consent-modal-body">
        <p><strong>SMS Reminders</strong> — We'll text you appointment confirmations, reminders, and updates about your vehicle's service status.</p>
        <p><strong>Email Reminders</strong> — We'll email you appointment confirmations, reminders, and updates about your vehicle's service status.</p>
        <p><strong>Promotional Offers</strong> (optional) — Occasional service specials, seasonal promotions, and maintenance recommendations.</p>
      </div>
      <p class="consent-modal-note">Message and data rates may apply for SMS. You can opt out at any time by contacting us at <a href="tel:2316750723">231-675-0723</a> or replying STOP to any text message. You can update your preferences from your account dashboard.</p>
    </div>
  </div>
```

**Step 4: Commit**

```bash
git add login.html
git commit -m "feat: replace single consent checkbox with 4 separate opt-ins on signup forms"
```

---

### Task 6: Update Signup Validation and handleSignup (login.html + js/auth.js)

**Files:**
- Modify: `login.html:665-670` (submitSignup consent validation)
- Modify: `login.html:675` (handleSignup call)
- Modify: `js/auth.js:298-321` (handleSignup function)

**Step 1: Update submitSignup validation**

Replace lines 665-670 in `login.html`:

```javascript
      var smsConsent = document.getElementById('signupSmsConsent').checked;

      if (!smsConsent) {
        showMessage('Please agree to the Terms of Service, Privacy Policy, and communications consent to create an account.', true);
        return;
      }
```

With:

```javascript
      var tosConsent = document.getElementById('signupTosConsent').checked;
      var smsConsent = document.getElementById('signupSmsConsent').checked;
      var emailConsent = document.getElementById('signupEmailConsent').checked;
      var marketingConsent = document.getElementById('signupMarketingConsent').checked;

      if (!tosConsent) {
        showMessage('Please agree to the Terms of Service and Privacy Policy to create an account.', true);
        return;
      }
      if (!smsConsent || !emailConsent) {
        showMessage('Please consent to SMS and email reminders to create an account.', true);
        return;
      }
```

**Step 2: Update handleSignup call to pass all consent values**

Replace line 675 in `login.html`:

```javascript
      handleSignup(email, password, firstName, lastName, phone, smsConsent)
```

With:

```javascript
      handleSignup(email, password, firstName, lastName, phone, smsConsent, emailConsent, marketingConsent)
```

**Step 3: Update handleSignup function signature and Firestore save**

Replace lines 298-321 in `js/auth.js`:

```javascript
  window.handleSignup = function(email, password, firstName, lastName, phone, smsConsent) {
    console.log('[Signup] Starting signup for:', email);
    var fullName = firstName + ' ' + lastName;
    window._authActionInProgress = true;
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function(userCredential) {
        var user = userCredential.user;
        console.log('[Signup] User created in Firebase Auth. UID:', user.uid);
        // Update display name
        return user.updateProfile({ displayName: fullName }).then(function() {
          console.log('[Signup] Display name updated.');
          // Save profile to Firestore with emailVerified: false (new signup requiring verification)
          return db.collection('users').doc(user.uid).set({
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            smsConsent: !!smsConsent,
            tosAccepted: true,
            tosAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
```

With:

```javascript
  window.handleSignup = function(email, password, firstName, lastName, phone, smsConsent, emailConsent, marketingConsent) {
    console.log('[Signup] Starting signup for:', email);
    var fullName = firstName + ' ' + lastName;
    window._authActionInProgress = true;
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function(userCredential) {
        var user = userCredential.user;
        console.log('[Signup] User created in Firebase Auth. UID:', user.uid);
        // Update display name
        return user.updateProfile({ displayName: fullName }).then(function() {
          console.log('[Signup] Display name updated.');
          var now = firebase.firestore.FieldValue.serverTimestamp();
          // Save profile to Firestore with emailVerified: false (new signup requiring verification)
          return db.collection('users').doc(user.uid).set({
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            smsConsent: !!smsConsent,
            smsConsentAt: now,
            emailConsent: !!emailConsent,
            emailConsentAt: now,
            marketingConsent: !!marketingConsent,
            marketingConsentAt: marketingConsent ? now : null,
            tosAccepted: true,
            tosAcceptedAt: now,
            emailVerified: false,
            createdAt: now
          });
```

**Step 4: Commit**

```bash
git add login.html js/auth.js
git commit -m "feat: validate and store separate consent fields on email/password signup"
```

---

### Task 7: Update Google Sign-In Consent Handling (login.html + js/auth.js)

**Files:**
- Modify: `login.html:430-456` (handleGoogleSignIn)
- Modify: `login.html:186-206` (Google new user consent modal HTML)
- Modify: `login.html:493-541` (agreeGoogleConsent)
- Modify: `js/auth.js:442-453` (Google sign-in fallback doc creation)

**Step 1: Update handleGoogleSignIn to check all required checkboxes**

Replace lines 430-456 in `login.html`:

```javascript
    function handleGoogleSignIn() {
      clearMessage();
      var isSignupTab = document.getElementById('signupTab').classList.contains('active');
      var googleConsent = document.getElementById('google-consent-checkbox');

      if (isSignupTab) {
        // On the signup tab, accept consent from either checkbox
        var signupConsent = document.getElementById('signupSmsConsent');
        var hasConsent = (googleConsent && googleConsent.checked) || (signupConsent && signupConsent.checked);
        if (!hasConsent) {
          showMessage('Please agree to the Terms of Service, Privacy Policy, and communications consent to sign up.', true);
          return;
        }
        // Set global flag so auth.js can read it for new Google users
        window._signupConsent = true;
        // On signup tab consent is already given — clear the new-user handler
        // so auth.js creates the doc immediately
        window._onNewGoogleUser = null;
      } else {
        // Login tab — register the new-user handler so auth.js shows
        // the consent modal instead of creating the doc immediately
        window._signupConsent = false;
        window._onNewGoogleUser = showGoogleConsentModal;
      }

      signInWithGoogle();
    }
```

With:

```javascript
    function handleGoogleSignIn() {
      clearMessage();
      var isSignupTab = document.getElementById('signupTab').classList.contains('active');

      if (isSignupTab) {
        // On the signup tab, check for consent from either the Google or signup checkboxes
        var hasTos = (document.getElementById('googleTosConsent') && document.getElementById('googleTosConsent').checked) ||
                     (document.getElementById('signupTosConsent') && document.getElementById('signupTosConsent').checked);
        var hasSms = (document.getElementById('googleSmsConsent') && document.getElementById('googleSmsConsent').checked) ||
                     (document.getElementById('signupSmsConsent') && document.getElementById('signupSmsConsent').checked);
        var hasEmail = (document.getElementById('googleEmailConsent') && document.getElementById('googleEmailConsent').checked) ||
                       (document.getElementById('signupEmailConsent') && document.getElementById('signupEmailConsent').checked);

        if (!hasTos) {
          showMessage('Please agree to the Terms of Service and Privacy Policy to sign up.', true);
          return;
        }
        if (!hasSms || !hasEmail) {
          showMessage('Please consent to SMS and email reminders to sign up.', true);
          return;
        }

        // Store consent values for auth.js to use when creating the user doc
        var hasMarketing = (document.getElementById('googleMarketingConsent') && document.getElementById('googleMarketingConsent').checked) ||
                           (document.getElementById('signupMarketingConsent') && document.getElementById('signupMarketingConsent').checked);
        window._signupConsent = true;
        window._signupConsentValues = { sms: true, email: true, marketing: !!hasMarketing };
        window._onNewGoogleUser = null;
      } else {
        // Login tab — register the new-user handler so auth.js shows
        // the consent modal instead of creating the doc immediately
        window._signupConsent = false;
        window._signupConsentValues = null;
        window._onNewGoogleUser = showGoogleConsentModal;
      }

      signInWithGoogle();
    }
```

**Step 2: Update Google new user consent modal HTML**

Replace lines 186-206 in `login.html`:

```html
  <div id="googleNewUserConsentModal" class="google-consent-overlay">
    <div class="google-consent-card">
      <button type="button" class="google-consent-close" id="googleConsentCloseBtn">&times;</button>
      <h3 class="google-consent-title">ALMOST THERE</h3>
      <p class="google-consent-subtitle">It looks like this is your first time here. Before we create your account, please review the following:</p>

      <div class="google-consent-checkboxes">
        <label class="google-consent-label google-consent-label--required">
          <input type="checkbox" id="googleConsentCombined">
          <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a>, and consent to receive communications from Boris Enterprises.<span class="required-star">*</span> <a href="#" class="consent-details-link" onclick="event.preventDefault(); document.getElementById('signupConsentModal').style.display='flex';">Details</a></span>
        </label>
      </div>

      <p class="google-consent-error" id="googleConsentError" style="display: none;">You must agree to the Terms of Service, Privacy Policy, and communications consent to continue.</p>

      <div class="google-consent-actions">
        <button type="button" class="btn btn-primary google-consent-agree" id="googleConsentAgreeBtn">CREATE MY ACCOUNT</button>
        <button type="button" class="google-consent-cancel" id="googleConsentCancelBtn">Cancel</button>
      </div>
    </div>
  </div>
```

With:

```html
  <div id="googleNewUserConsentModal" class="google-consent-overlay">
    <div class="google-consent-card">
      <button type="button" class="google-consent-close" id="googleConsentCloseBtn">&times;</button>
      <h3 class="google-consent-title">ALMOST THERE</h3>
      <p class="google-consent-subtitle">It looks like this is your first time here. Before we create your account, please review the following:</p>

      <div class="google-consent-checkboxes">
        <label class="google-consent-label google-consent-label--required">
          <input type="checkbox" id="googleModalTosConsent">
          <span>I agree to the <a href="/terms.html" target="_blank">Terms of Service</a> and <a href="/privacy.html" target="_blank">Privacy Policy</a><span class="required-star">*</span></span>
        </label>
        <label class="google-consent-label google-consent-label--required">
          <input type="checkbox" id="googleModalSmsConsent">
          <span>I consent to receive appointment reminders and updates via SMS<span class="required-star">*</span></span>
        </label>
        <label class="google-consent-label google-consent-label--required">
          <input type="checkbox" id="googleModalEmailConsent">
          <span>I consent to receive appointment reminders and updates via email<span class="required-star">*</span></span>
        </label>
        <label class="google-consent-label">
          <input type="checkbox" id="googleModalMarketingConsent">
          <span>I'd like to receive promotional offers and service specials</span>
        </label>
      </div>

      <p class="google-consent-error" id="googleConsentError" style="display: none;">You must agree to the Terms of Service and consent to SMS and email reminders to continue.</p>

      <div class="google-consent-actions">
        <button type="button" class="btn btn-primary google-consent-agree" id="googleConsentAgreeBtn">CREATE MY ACCOUNT</button>
        <button type="button" class="google-consent-cancel" id="googleConsentCancelBtn">Cancel</button>
      </div>
    </div>
  </div>
```

**Step 3: Update showGoogleConsentModal to reset all checkboxes**

Replace lines 463-474 in `login.html`:

```javascript
    function showGoogleConsentModal(user) {
      _pendingGoogleUser = user;
      // Reset modal state
      document.getElementById('googleConsentCombined').checked = false;
      document.getElementById('googleConsentError').style.display = 'none';
      // Reset agree button in case it was left in loading state
      var agreeBtn = document.getElementById('googleConsentAgreeBtn');
      agreeBtn.disabled = false;
      agreeBtn.textContent = 'CREATE MY ACCOUNT';
      // Show modal
      document.getElementById('googleNewUserConsentModal').style.display = 'flex';
    }
```

With:

```javascript
    function showGoogleConsentModal(user) {
      _pendingGoogleUser = user;
      // Reset modal state — all checkboxes unchecked
      document.getElementById('googleModalTosConsent').checked = false;
      document.getElementById('googleModalSmsConsent').checked = false;
      document.getElementById('googleModalEmailConsent').checked = false;
      document.getElementById('googleModalMarketingConsent').checked = false;
      document.getElementById('googleConsentError').style.display = 'none';
      // Reset agree button in case it was left in loading state
      var agreeBtn = document.getElementById('googleConsentAgreeBtn');
      agreeBtn.disabled = false;
      agreeBtn.textContent = 'CREATE MY ACCOUNT';
      // Show modal
      document.getElementById('googleNewUserConsentModal').style.display = 'flex';
    }
```

**Step 4: Update agreeGoogleConsent to validate all required checkboxes**

Replace lines 493-541 in `login.html`:

```javascript
    function agreeGoogleConsent() {
      var combinedChecked = document.getElementById('googleConsentCombined').checked;
      var errorEl = document.getElementById('googleConsentError');

      if (!combinedChecked) {
        errorEl.style.display = 'block';
        return;
      }

      errorEl.style.display = 'none';
      var user = _pendingGoogleUser;
      _pendingGoogleUser = null;

      if (!user) {
        hideGoogleConsentModal();
        showMessage('Something went wrong. Please try again.', true);
        window._authActionInProgress = false;
        return;
      }

      // Disable the button to prevent double-clicks
      var agreeBtn = document.getElementById('googleConsentAgreeBtn');
      agreeBtn.disabled = true;
      agreeBtn.textContent = 'PLEASE WAIT...';

      var userData = {
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        smsConsent: true,
        emailVerified: true,
        tosAccepted: true,
        tosAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      createGoogleUserDoc(user.uid, userData).then(function() {
        console.log('[GoogleConsent] User doc created after consent. Redirecting...');
        hideGoogleConsentModal();
        window._authActionInProgress = false;
        window.location.href = 'dashboard.html';
      }).catch(function(writeErr) {
        console.error('[GoogleConsent] Could not create user doc:', writeErr);
        hideGoogleConsentModal();
        window._authActionInProgress = false;
        showMessage('Account created but profile save failed. Please update your profile on the dashboard.', true);
        setTimeout(function() { window.location.href = 'dashboard.html'; }, 2000);
      });
    }
```

With:

```javascript
    function agreeGoogleConsent() {
      var tosChecked = document.getElementById('googleModalTosConsent').checked;
      var smsChecked = document.getElementById('googleModalSmsConsent').checked;
      var emailChecked = document.getElementById('googleModalEmailConsent').checked;
      var marketingChecked = document.getElementById('googleModalMarketingConsent').checked;
      var errorEl = document.getElementById('googleConsentError');

      if (!tosChecked || !smsChecked || !emailChecked) {
        errorEl.style.display = 'block';
        return;
      }

      errorEl.style.display = 'none';
      var user = _pendingGoogleUser;
      _pendingGoogleUser = null;

      if (!user) {
        hideGoogleConsentModal();
        showMessage('Something went wrong. Please try again.', true);
        window._authActionInProgress = false;
        return;
      }

      // Disable the button to prevent double-clicks
      var agreeBtn = document.getElementById('googleConsentAgreeBtn');
      agreeBtn.disabled = true;
      agreeBtn.textContent = 'PLEASE WAIT...';

      var now = firebase.firestore.FieldValue.serverTimestamp();
      var userData = {
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        smsConsent: true,
        smsConsentAt: now,
        emailConsent: true,
        emailConsentAt: now,
        marketingConsent: !!marketingChecked,
        marketingConsentAt: marketingChecked ? now : null,
        emailVerified: true,
        tosAccepted: true,
        tosAcceptedAt: now,
        createdAt: now
      };

      createGoogleUserDoc(user.uid, userData).then(function() {
        console.log('[GoogleConsent] User doc created after consent. Redirecting...');
        hideGoogleConsentModal();
        window._authActionInProgress = false;
        window.location.href = 'dashboard.html';
      }).catch(function(writeErr) {
        console.error('[GoogleConsent] Could not create user doc:', writeErr);
        hideGoogleConsentModal();
        window._authActionInProgress = false;
        showMessage('Account created but profile save failed. Please update your profile on the dashboard.', true);
        setTimeout(function() { window.location.href = 'dashboard.html'; }, 2000);
      });
    }
```

**Step 5: Update Google sign-in fallback doc creation in auth.js**

Replace lines 442-453 in `js/auth.js`:

```javascript
            var googleConsentEl = document.getElementById('google-consent-checkbox');
            var smsConsent = !!window._signupConsent || !!(googleConsentEl && googleConsentEl.checked);
            var userData = {
              name: user.displayName || '',
              email: user.email || '',
              phone: '',
              smsConsent: smsConsent,
              tosAccepted: true,
              tosAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
              emailVerified: true,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
```

With:

```javascript
            var consentVals = window._signupConsentValues || { sms: false, email: false, marketing: false };
            var now = firebase.firestore.FieldValue.serverTimestamp();
            var userData = {
              name: user.displayName || '',
              email: user.email || '',
              phone: '',
              smsConsent: !!consentVals.sms,
              smsConsentAt: consentVals.sms ? now : null,
              emailConsent: !!consentVals.email,
              emailConsentAt: consentVals.email ? now : null,
              marketingConsent: !!consentVals.marketing,
              marketingConsentAt: consentVals.marketing ? now : null,
              tosAccepted: true,
              tosAcceptedAt: now,
              emailVerified: true,
              createdAt: now
            };
```

**Step 6: Commit**

```bash
git add login.html js/auth.js
git commit -m "feat: update Google sign-in consent to use separate opt-in checkboxes"
```

---

### Task 8: Update Dashboard Profile Toggles (dashboard.html)

**Files:**
- Modify: `dashboard.html:157-162` (profile checkbox HTML)
- Modify: `dashboard.html:265` (initDashboard consent display)
- Modify: `dashboard.html:488` (cancelProfileEdit consent disable)
- Modify: `dashboard.html:502` (submitProfile consent read)
- Modify: `dashboard.html:516-519` (Firestore update)
- Modify: `dashboard.html:531` (post-save consent disable)

**Step 1: Replace single opt-out checkbox with 3 separate toggles**

Replace lines 157-162 in `dashboard.html`:

```html
                    <div class="form-group profile-checkbox-group">
                      <label class="checkbox-label" for="profileSmsConsent">
                        <input type="checkbox" id="profileSmsConsent" disabled>
                        <span>Opt out of communications (SMS &amp; email)</span>
                      </label>
                    </div>
```

With:

```html
                    <div class="form-group profile-checkbox-group profile-consent-toggles">
                      <p class="consent-heading">Communication Preferences</p>
                      <label class="checkbox-label" for="profileSmsConsent">
                        <input type="checkbox" id="profileSmsConsent" disabled>
                        <span>SMS appointment reminders and updates</span>
                      </label>
                      <label class="checkbox-label" for="profileEmailConsent">
                        <input type="checkbox" id="profileEmailConsent" disabled>
                        <span>Email appointment reminders and updates</span>
                      </label>
                      <label class="checkbox-label" for="profileMarketingConsent">
                        <input type="checkbox" id="profileMarketingConsent" disabled>
                        <span>Promotional offers and service specials</span>
                      </label>
                    </div>
```

**Step 2: Update initDashboard to display all 3 consent values**

Replace line 265 in `dashboard.html`:

```javascript
          document.getElementById('profileSmsConsent').checked = !currentUserData.smsConsent;
```

With:

```javascript
          document.getElementById('profileSmsConsent').checked = !!currentUserData.smsConsent;
          document.getElementById('profileEmailConsent').checked = !!currentUserData.emailConsent;
          document.getElementById('profileMarketingConsent').checked = !!currentUserData.marketingConsent;
```

Note: The old code used **inverted** logic (`!smsConsent` because it was "opt out"). The new code uses **direct** logic (checked = opted in).

**Step 3: Update cancelProfileEdit to disable all 3 checkboxes**

Replace line 488 in `dashboard.html`:

```javascript
      document.getElementById('profileSmsConsent').disabled = true;
```

With:

```javascript
      document.getElementById('profileSmsConsent').disabled = true;
      document.getElementById('profileEmailConsent').disabled = true;
      document.getElementById('profileMarketingConsent').disabled = true;
```

**Step 4: Update submitProfile to read all 3 consent values**

Replace line 502 in `dashboard.html`:

```javascript
      var smsConsent = !document.getElementById('profileSmsConsent').checked;
```

With:

```javascript
      var smsConsent = document.getElementById('profileSmsConsent').checked;
      var emailConsent = document.getElementById('profileEmailConsent').checked;
      var marketingConsent = document.getElementById('profileMarketingConsent').checked;
```

**Step 5: Update Firestore update call**

Replace lines 516-519 in `dashboard.html`:

```javascript
      db.collection('users').doc(user.uid).update({
        name: name,
        phone: phone,
        smsConsent: smsConsent
```

With:

```javascript
      var now = firebase.firestore.FieldValue.serverTimestamp();
      db.collection('users').doc(user.uid).update({
        name: name,
        phone: phone,
        smsConsent: smsConsent,
        smsConsentAt: now,
        emailConsent: emailConsent,
        emailConsentAt: now,
        marketingConsent: marketingConsent,
        marketingConsentAt: now
```

**Step 6: Update post-save field disable**

Replace line 531 in `dashboard.html`:

```javascript
        document.getElementById('profileSmsConsent').disabled = true;
```

With:

```javascript
        document.getElementById('profileSmsConsent').disabled = true;
        document.getElementById('profileEmailConsent').disabled = true;
        document.getElementById('profileMarketingConsent').disabled = true;
```

**Step 7: Update editProfile to enable all 3 checkboxes**

Find the editProfile function (around line 475) where `profileSmsConsent` is enabled. Add enables for the new checkboxes. The existing line:

```javascript
      document.getElementById('profileSmsConsent').disabled = false;
```

Should become:

```javascript
      document.getElementById('profileSmsConsent').disabled = false;
      document.getElementById('profileEmailConsent').disabled = false;
      document.getElementById('profileMarketingConsent').disabled = false;
```

**Step 8: Commit**

```bash
git add dashboard.html
git commit -m "feat: replace single opt-out toggle with 3 separate consent toggles on dashboard"
```

---

### Task 9: Add CSS for Multi-Checkbox Consent Groups

**Files:**
- Modify: `css/styles.css` (add styles for consent-group--multi)

**Step 1: Add CSS rules for the new consent layout**

Add the following at the end of the existing consent-related styles in `css/styles.css`:

```css
/* Multi-checkbox consent groups */
.consent-group--multi {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.consent-group--multi .consent-heading {
  font-family: 'Oswald', sans-serif;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--steel);
  margin: 0 0 4px 0;
}

.consent-group--multi .consent-label {
  margin: 0;
}

/* Dashboard profile consent toggles */
.profile-consent-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-consent-toggles .consent-heading {
  font-family: 'Oswald', sans-serif;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--silver);
  margin: 8px 0 0 0;
}
```

**Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: add CSS for multi-checkbox consent groups"
```

---

### Task 10: Update Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

**Step 1: No changes needed**

The current Firestore rules for `users` validate that `name` and `email` are strings but do not validate consent fields. The `guest_appointments` rule allows anyone to create. Adding optional fields does not break existing rules. No rule changes are required.

**Step 2: Commit (skip — no changes)**

---

### Task 11: Manual Smoke Test

**No files to modify — this is a verification step.**

Test the following flows in the browser:

1. **Contact form (guest):** Visit index.html logged out. Verify 4 checkboxes appear. Try submitting without checking required boxes — verify error messages. Check all required + submit — verify guest_appointment in Firestore has consent fields.

2. **Contact form (logged-in):** Log in, visit index.html. Verify checkboxes pre-fill based on profile preferences. Submit and verify appointment saved.

3. **Email/Password signup:** Visit login.html, click Sign Up tab. Verify 4 unchecked checkboxes. Try creating account without required ones — verify error. Create account with all required — verify user doc has all consent fields.

4. **Google Sign-In (signup tab):** On Sign Up tab, click Google button without checking — verify error. Check required boxes, sign in — verify user doc.

5. **Google Sign-In (login tab, new user):** On Login tab, click Google with new account — verify modal shows 4 checkboxes. Try agreeing without required — verify error. Check all required, agree — verify user doc.

6. **Dashboard profile:** Log in, go to dashboard. Verify 3 separate toggles (SMS, Email, Marketing). Edit profile, toggle them, save — verify Firestore updated with individual fields + timestamps.
