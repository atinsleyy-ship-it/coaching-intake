// Replace with your deployed Google Apps Script URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyVwBR0GPWFvnxy3A4SLkd_ZTQm8VDO5F23HVzYVYAY7N8BVGG84CddlmJwuZKVyW-WLg/exec';

const RULES = [
  {
    id: 'name',
    errorId: 'nameError',
    validate: v => v.trim().length < 2 ? 'Please enter your full name.' : null
  },
  {
    id: 'email',
    errorId: 'emailError',
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? null : 'Please enter a valid email address.'
  },
  {
    id: 'phone',
    errorId: 'phoneError',
    validate: v => v.trim().length < 7 ? 'Please enter a valid phone number.' : null
  },
  {
    id: 'primaryGoal',
    errorId: 'primaryGoalError',
    validate: v => v ? null : 'Please select your primary goal.'
  },
  {
    id: 'fitnessLevel',
    errorId: 'fitnessLevelError',
    validate: v => v ? null : 'Please select your current fitness level.'
  },
  {
    id: 'experience',
    errorId: 'experienceError',
    validate: v => v ? null : 'Please select your training experience.'
  },
  {
    id: 'availability',
    errorId: 'availabilityError',
    validate: v => v ? null : 'Please select your availability.'
  }
];

// Your Calendly 15-min event link — replace YOUR-LINK with your handle
const CALENDLY_URL = 'https://calendly.com/YOUR-LINK/15min';

const form        = document.getElementById('intakeForm');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = submitBtn.querySelector('.btn-text');
const btnLoading  = submitBtn.querySelector('.btn-loading');
const successMsg  = document.getElementById('successMessage');
const errorBanner = document.getElementById('errorBanner');
const errorText   = document.getElementById('errorText');

function validateField(rule) {
  const input   = document.getElementById(rule.id);
  const errorEl = document.getElementById(rule.errorId);
  const message = rule.validate(input.value);
  if (message) {
    errorEl.textContent = message;
    input.classList.add('invalid');
    return false;
  }
  errorEl.textContent = '';
  input.classList.remove('invalid');
  return true;
}

RULES.forEach(rule => {
  const input = document.getElementById(rule.id);
  if (input) {
    input.addEventListener('input',  () => validateField(rule));
    input.addEventListener('change', () => validateField(rule));
  }
});

function collectData() {
  return {
    name:         document.getElementById('name').value.trim(),
    email:        document.getElementById('email').value.trim(),
    phone:        document.getElementById('phone').value.trim(),
    primaryGoal:    document.getElementById('primaryGoal').value,
    fitnessLevel:   document.getElementById('fitnessLevel').value,
    experience:     document.getElementById('experience').value,
    availability:   document.getElementById('availability').value,
    preferredSplit: document.getElementById('preferredSplit').value,
    injuries:       document.getElementById('injuries').value.trim()
  };
}

// Load the Calendly inline widget, pre-filling name + email from the form
function loadCalendly(data) {
  const url = `${CALENDLY_URL}?hide_gdpr_banner=1`
    + `&name=${encodeURIComponent(data.name)}`
    + `&email=${encodeURIComponent(data.email)}`;
  const target = document.getElementById('calendlyEmbed');

  function init() {
    if (window.Calendly) {
      Calendly.initInlineWidget({ url, parentElement: target });
    } else {
      // widget.js still loading — retry shortly
      setTimeout(init, 200);
    }
  }
  init();
}

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.hidden     = on;
  btnLoading.hidden  = !on;
}

function showError(message) {
  errorText.textContent = message;
  errorBanner.hidden = false;
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

let submitted = false;

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const allValid = RULES.map(validateField).every(Boolean);
  if (!allValid) {
    const firstInvalid = form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (submitted) return;
  errorBanner.hidden = true;
  setLoading(true);

  const data = collectData();

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === 'success') {
      submitted = true;
      form.hidden = true;
      successMsg.hidden = false;
      loadCalendly(data);
      successMsg.scrollIntoView({ behavior: 'smooth' });
    } else {
      throw new Error(result.message || 'Unexpected error from server.');
    }
  } catch (err) {
    setLoading(false);
    showError(
      err.message.includes('Failed to fetch')
        ? 'Could not reach the server. Check your connection and try again.'
        : `Submission failed: ${err.message}`
    );
  }
});
