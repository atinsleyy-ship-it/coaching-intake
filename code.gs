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

// Column widths (pixels) matched to each header above
const COL_WIDTHS = [160, 160, 220, 130, 60, 110, 80, 100, 160, 180, 110, 160, 260, 160, 110, 110, 110];

// Stripe colors for alternating rows
const ROW_ODD  = '#f9f7f4'; // warm off-white
const ROW_EVEN = '#ffffff'; // white

// ---------------------------------------------------------------------------
// GET — health check
// ---------------------------------------------------------------------------
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Coaching intake endpoint is live.' });
}

// ---------------------------------------------------------------------------
// POST — receives JSON and appends a formatted row
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    ensureHeaders(sheet);

    const newRow = sheet.getLastRow() + 1;
    appendRow(sheet, data);
    formatDataRow(sheet, newRow);

    return jsonResponse({ status: 'success', message: 'Application received.' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ---------------------------------------------------------------------------
// RUN THIS ONCE — call formatAll() from the Apps Script editor to style
// all existing rows in the sheet. Go to the editor, select "formatAll"
// from the function dropdown, and click Run.
// ---------------------------------------------------------------------------
function formatAll() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 1) return;

  // Re-apply the header
  styleHeader(sheet);

  // Style every data row
  for (let row = 2; row <= lastRow; row++) {
    formatDataRow(sheet, row);
  }

  // Apply column widths
  applyColumnWidths(sheet);

  SpreadsheetApp.flush();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow(HEADERS);
  styleHeader(sheet);
  applyColumnWidths(sheet);
}

function styleHeader(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setValues([HEADERS]);
  range.setFontWeight('bold');
  range.setFontSize(10);
  range.setFontFamily('Arial');
  range.setFontColor('#ffffff');
  range.setBackground('#1a1a2e');        // deep navy — matches the form aesthetic
  range.setHorizontalAlignment('left');
  range.setVerticalAlignment('middle');
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
}

function applyColumnWidths(sheet) {
  COL_WIDTHS.forEach((width, i) => sheet.setColumnWidth(i + 1, width));
}

function formatDataRow(sheet, row) {
  const range = sheet.getRange(row, 1, 1, HEADERS.length);
  const bg = (row % 2 === 0) ? ROW_EVEN : ROW_ODD;

  range.setBackground(bg);
  range.setFontSize(10);
  range.setFontFamily('Arial');
  range.setFontColor('#1a1a2e');
  range.setVerticalAlignment('middle');
  range.setHorizontalAlignment('left');

  // Wrap long text columns (Injuries, Goal, Diet)
  const wrapCols = [9, 13, 14]; // 1-indexed: primaryGoal, injuries, currentDiet
  wrapCols.forEach(col => {
    sheet.getRange(row, col).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  });

  sheet.setRowHeight(row, 28);
}

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

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
