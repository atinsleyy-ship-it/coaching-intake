// =============================================================================
// Coaching Intake Form — Google Apps Script Backend
// Deploy as: Extensions > Apps Script > Deploy > New Deployment > Web App
// Execute as: Me | Who has access: Anyone
// =============================================================================

const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Submitted At',
  'Name',
  'Email',
  'Phone',
  'Age',
  'Biological Sex',
  'Height',
  'Weight (lbs)',
  'Primary Goal',
  'Experience',
  'Days per Week',
  'Preferred Split',
  'Injuries / Limitations',
  'Current Diet',
  'Water per Day',
  'Alcohol per Week',
  'Start Date'
];

// ---------------------------------------------------------------------------
// GET — health check so you can confirm the deployment is live
// Visit the Web App URL in a browser; you should see { "status": "ok" }
// ---------------------------------------------------------------------------
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Coaching intake endpoint is live.' });
}

// ---------------------------------------------------------------------------
// POST — receives JSON from the intake form and appends a row to the sheet
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    ensureHeaders(sheet);
    appendRow(sheet, data);

    return jsonResponse({ status: 'success', message: 'Application received.' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Return the submissions sheet, creating it if it doesn't exist yet
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

// Write the header row on first use and style it for readability
function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow(HEADERS);

  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setFontWeight('bold');
  range.setBackground('#1a1a2e');
  range.setFontColor('#ffffff');

  // Auto-resize all columns so nothing is clipped
  for (let i = 1; i <= HEADERS.length; i++) {
    sheet.autoResizeColumn(i);
  }

  sheet.setFrozenRows(1);
}

// Map form fields to row cells in the same order as HEADERS
function appendRow(sheet, data) {
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );

  sheet.appendRow([
    timestamp,
    data.name           || '',
    data.email          || '',
    data.phone          || '',
    data.age            || '',
    data.biologicalSex  || '',
    data.height         || '',
    data.weight         || '',
    data.primaryGoal    || '',
    data.experience     || '',
    data.daysPerWeek    || '',
    data.preferredSplit || '',
    data.injuries       || '',
    data.currentDiet    || '',
    data.waterPerDay    || '',
    data.alcoholPerWeek || '',
    data.startDate      || ''
  ]);
}

// Wrap any object in a JSON ContentService response
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
