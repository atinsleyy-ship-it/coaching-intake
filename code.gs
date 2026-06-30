const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Submitted At',
  'Name',
  'Email',
  'Phone',
  'Primary Goal',
  'Fitness Level',
  'Experience',
  'Days per Week',
  'Preferred Split',
  'Injuries / Limitations'
];

const COL_WIDTHS = [160, 160, 220, 130, 180, 200, 180, 110, 160, 260];

const ROW_ODD  = '#f9f7f4';
const ROW_EVEN = '#ffffff';

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Coaching intake endpoint is live.' });
}

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

function formatAll() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return;

  styleHeader(sheet);

  for (let row = 2; row <= lastRow; row++) {
    formatDataRow(sheet, row);
  }

  applyColumnWidths(sheet);
  SpreadsheetApp.flush();
}

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
  range.setBackground('#1a1a2e');
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

  // Wrap injuries column (col 10)
  sheet.getRange(row, 10).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
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
    data.primaryGoal    || '',
    data.fitnessLevel   || '',
    data.experience     || '',
    data.availability   || '',
    data.preferredSplit || '',
    data.injuries       || ''
  ]);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
