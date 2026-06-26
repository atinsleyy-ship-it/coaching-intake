// =============================================================================
// Coaching Intake Form — Frontend Logic
// Replace WEB_APP_URL below with your deployed Google Apps Script URL.
// =============================================================================

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyVwBR0GPWFvnxy3A4SLkd_ZTQm8VDO5F23HVzYVYAY7N8BVGG84CddlmJwuZKVyW-WLg/exec';

// ---------------------------------------------------------------------------
// Validation rules
// Each entry: { id, errorId, validate(value) → string|null }
// Returning a string shows that string as the error; null means valid.
// ---------------------------------------------------------------------------
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
      ? null
      : 'Please enter a valid email address.'
  },
  {
    id: 'phone',
    errorId: 'phoneError',
    validate: v => v.trim().length < 7 ? 'Please enter a valid phone number.' : null
  },
  {
    id: 'age',
    errorId: 'ageError',
    validate: v => {
      const n = Number(v);
      if (!v.trim() || isNaN(n)) return 'Please enter your age.';
      if (n < 13 || n > 100)    return 'Age must be between 13 and 100.';
      return null;
    }
  },
  {
    id: 'biologicalSex',
    errorId: 'biologicalSexError',
    validate: v => v ? null : 'Please select an option.'
  },
  {
    id: 'weight',
    errorId: 'weightError',
    validate: v => {
      const n = Number(v);
      if (!v.trim() || isNaN(n)) return 'Please enter your weight.';
      if (n < 50 || n > 700)    return 'Please enter a realistic weight.';
      return null;
    }
  },
  {
    id: 'primaryGoal',
    errorId: 'primaryGoalError',
    validate: v => v ? null : 'Please select your primary goal.'
  },
  {
    id: 'experience',
    errorId: 'experienceError',
    validate: v => v ? null : 'Please select your experience level.'
  },
  {
    id: 'daysPerWeek',
    errorId: 'daysPerWeekError',
    validate: v => v ? null : 'Please select how many days per week.'
  },
  {
    id: 'waterPerDay',
    errorId: 'waterPerDayError',
    validate: v => {
      const n = Number(v);
      if (v.trim() === '' || isNaN(n)) return 'Please enter your daily water intake.';
      if (n < 0)                       return 'Must be 0 or more.';
      return null;
    }
  },
  {
    id: 'alcoholPerWeek',
    errorId: 'alcoholPerWeekError',
    validate: v => {
      const n = Number(v);
      if (v.trim() === '' || isNaN(n)) return 'Please enter drinks per week (use 0 if none).';
      if (n < 0)                       return 'Must be 0 or more.';
      return null;
    }
  },
  {
    id: 'startDate',
    errorId: 'startDateError',
    validate: v => v ? null : 'Please select a desired start date.'
  }
];

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const form         = document.getElementById('intakeForm');
const submitBtn    = document.getElementById('submitBtn');
const btnText      = submitBtn.querySelector('.btn-text');
const btnLoading   = submitBtn.querySelector('.btn-loading');
const successMsg   = document.getElementById('successMessage');
const errorBanner  = document.getElementById('errorBanner');
const errorText    = document.getElementById('errorText');

// ---------------------------------------------------------------------------
// Validate a single field; returns true if valid
// ---------------------------------------------------------------------------
function validateField(rule) {
  const input = document.getElementById(rule.id);
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

// Clear error on user input so feedback is immediate
RULES.forEach(rule => {
  const input = document.getElementById(rule.id);
  if (input) {
    input.addEventListener('input', () => validateField(rule));
    input.addEventListener('change', () => validateField(rule));
  }
});

// ---------------------------------------------------------------------------
// Collect all form values into a plain object
// ---------------------------------------------------------------------------
function collectData() {
  return {
    name:           document.getElementById('name').value.trim(),
    email:          document.getElementById('email').value.trim(),
    phone:          document.getElementById('phone').value.trim(),
    age:            document.getElementById('age').value.trim(),
    biologicalSex:  document.getElementById('biologicalSex').value,
    height:         document.getElementById('height').value.trim(),
    weight:         document.getElementById('weight').value.trim(),
    primaryGoal:    document.getElementById('primaryGoal').value,
    experience:     document.getElementById('experience').value,
    daysPerWeek:    document.getElementById('daysPerWeek').value,
    preferredSplit: document.getElementById('preferredSplit').value,
    injuries:       document.getElementById('injuries').value.trim(),
    currentDiet:    document.getElementById('currentDiet').value,
    waterPerDay:    document.getElementById('waterPerDay').value.trim(),
    alcoholPerWeek: document.getElementById('alcoholPerWeek').value.trim(),
    startDate:      document.getElementById('startDate').value
  };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
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

function hideError() {
  errorBanner.hidden = true;
}

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------
let submitted = false; // prevent duplicate submissions

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Validate every required field
  const allValid = RULES.map(validateField).every(Boolean);
  if (!allValid) {
    // Scroll to the first visible error
    const firstInvalid = form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Guard against double-submits
  if (submitted) return;

  hideError();
  setLoading(true);

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      // Google Apps Script requires text/plain to avoid CORS preflight
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(collectData())
    });

    const result = await response.json();

    if (result.status === 'success') {
      submitted = true;
      form.hidden = true;
      successMsg.hidden = false;
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
