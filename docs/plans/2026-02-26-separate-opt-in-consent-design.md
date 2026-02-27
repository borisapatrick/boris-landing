# Separate Opt-In Consent System

## Problem

The current codebase uses a single bundled checkbox that combines ToS acceptance, SMS consent, email consent, and marketing consent into one. This does not follow best practices — each communication type should have its own explicit opt-in.

Additionally, guest appointments do not store consent data at all, creating a compliance gap.

## Design

### Consent Categories (4 checkboxes)

| # | Label | Required | Firestore Field |
|---|-------|----------|-----------------|
| 1 | I agree to the Terms of Service and Privacy Policy | Yes | `tosAccepted`, `tosAcceptedAt` |
| 2 | I consent to receive appointment reminders and updates via SMS | Yes | `smsConsent`, `smsConsentAt` |
| 3 | I consent to receive appointment reminders and updates via email | Yes | `emailConsent`, `emailConsentAt` |
| 4 | I'd like to receive promotional offers and service specials | No | `marketingConsent`, `marketingConsentAt` |

### Forms Affected

1. **Contact/Appointment form** (`index.html`) — replace single checkbox with 4 checkboxes. Store consent fields in `guest_appointments` documents. For logged-in users with existing preferences, pre-check SMS/Email based on stored values.
2. **Email/Password Signup** (`login.html`) — replace bundled checkbox with 4 checkboxes. All start unchecked.
3. **Google Sign-In new user modal** (`login.html`) — replace single checkbox with 4 checkboxes. All start unchecked.
4. **Google Sign-In signup tab** (`login.html`) — replace inline checkbox with 4 checkboxes. All start unchecked.
5. **Profile Settings** (`dashboard.html`) — replace single "opt out" toggle with 3 separate toggles (SMS, Email, Marketing). ToS not shown since already accepted.

### Firestore Schema Changes

**Users collection** — replace `smsConsent: boolean` with:
- `smsConsent: boolean`
- `smsConsentAt: timestamp`
- `emailConsent: boolean`
- `emailConsentAt: timestamp`
- `marketingConsent: boolean`
- `marketingConsentAt: timestamp`
- `tosAccepted: boolean` (already exists)
- `tosAcceptedAt: timestamp` (already exists)

**Guest appointments collection** — add:
- `smsConsent: boolean`
- `emailConsent: boolean`
- `marketingConsent: boolean`
- `consentTimestamp: timestamp`

### Pre-fill Behavior

- **Signup forms**: All checkboxes always unchecked. Users must actively opt in.
- **Contact form (logged-in users)**: SMS and Email pre-checked if user previously consented. Marketing pre-checked if previously opted in.
- **Contact form (guests)**: All checkboxes unchecked.
- **Dashboard profile**: Reflects current stored preferences.

### Validation

- ToS, SMS, and Email are required — form submission blocked without them.
- Marketing is optional — defaults to unchecked.
- Error messages appear below the consent group when required checkboxes are unchecked.

### Consent Details Modal

Update existing modal to explain the three communication categories:
- SMS reminders: what they'll receive via text
- Email reminders: what they'll receive via email
- Marketing: promotional offers, seasonal specials, follow-ups

### Files to Modify

- `index.html` — contact form HTML + consent modal
- `login.html` — signup form, Google consent modal, Google signup tab checkbox
- `dashboard.html` — profile consent toggles + update logic
- `js/main.js` — contact form validation + Firestore submission
- `js/auth.js` — signup consent handling, pre-fill logic for logged-in users, `saveGuestAppointmentToFirestore`
- `css/styles.css` — styling for multiple checkbox layout
- `firestore.rules` — update to require/allow new consent fields
