// PREPARED ONLY: add to the bound Sheet script after approval.
// Requires original response IDs recovered before first rebuild.
var MEMBER_COLUMNS = [
  ['Name','Full name'], ['Response ID','ID'], ['Submitted at (Pacific)','Submitted'],
  ['Interests','Interests'], ['About you','About you'], ['Availability','Availability'],
  ['Availability window start','Availability window start'], ['Availability window end','Availability window end'],
  ['Available Oct 6–10?','Available Oct 6–10?'], ['Based in','Based in'],
  ['Willing to travel to Berkeley','Willing to travel to Berkeley'],
  ['Budget tier','Budget tier'], ['Maximum spend','Max spend'], ['Activities','Activities'],
  ['Evening intent','Evening intent'], ['Side Quest interests','Side Quest interests'],
  ['Table preferences','Table formats'], ['Community affiliations','Community affiliations (self-reported)'],
  ['Other community','Other community'], ['Broader-community opt-in','Wider community opt-in'],
  ['Photo release','Photo release'], ['Photo / promotional consent details','Consent details'],
  ['Terms & conditions','Terms & conditions'], ['Show-up agreement','Show-up agreement'],
  ['Original show-up agreement','Original show-up agreement'], ['Referral source','Referral source']
];

function readableMemberValue(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === undefined || value === null || value === '' || /^(No answer|Not recorded)$/i.test(String(value))) return 'Not answered';
  return value;
}

function pacificSubmissionTime(value) {
  // Only explicit instants can be converted; never reinterpret naive timestamps.
  if (typeof value !== 'string' || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value)) return value ? 'Unconfirmed timezone: ' + value : 'Not answered';
  var instant = new Date(value);
  if (isNaN(instant.getTime())) return 'Invalid timestamp: ' + value;
  return Utilities.formatDate(instant, 'America/Los_Angeles', 'MMM d, yyyy h:mm:ss a z');
}

function memberViewRows(headers, rows) {
  var index = {};
  headers.forEach(function(header,i) { index[header] = i; });
  if (index.ID === undefined) throw new Error('Restore the ID header before creating Members');
  var seen = {};
  return rows.filter(function(row) { return row.some(function(value) { return value !== ''; }); }).map(function(row) {
    var id = row[index.ID];
    if (!id) throw new Error('Recover missing original response IDs before creating Members');
    if (seen[id]) throw new Error('Duplicate response ID: resolve the retry row before creating Members');
    seen[id] = true;
    return MEMBER_COLUMNS.map(function(column) {
      var value = index[column[1]] === undefined ? undefined : row[index[column[1]]];
      return column[1] === 'Submitted' ? pacificSubmissionTime(value) : readableMemberValue(value);
    });
  });
}

function refreshMembersView() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var source = book.getSheetByName('RESPONSES');
  var raw = source.getDataRange().getValues();
  // Validate first; no source values or formatting are modified.
  var rows = memberViewRows(raw[0],raw.slice(1));
  var view = book.getSheetByName('Members') || book.insertSheet('Members');
  var oldRows = view.getLastRow();
  var values = [MEMBER_COLUMNS.map(function(column) { return column[0]; })].concat(rows);
  var safeValues = values.map(function(row) { return row.map(function(value) { return typeof value === 'string' && /^[=+@-]/.test(value) ? "'"+value : value; }); });
  if (view.getMaxRows() < values.length) view.insertRowsAfter(view.getMaxRows(), values.length-view.getMaxRows());
  if (view.getMaxColumns() < MEMBER_COLUMNS.length) view.insertColumnsAfter(view.getMaxColumns(), MEMBER_COLUMNS.length-view.getMaxColumns());
  view.getRange(1,1,values.length,MEMBER_COLUMNS.length).setValues(safeValues);
  if (oldRows > values.length) view.getRange(values.length+1,1,oldRows-values.length,MEMBER_COLUMNS.length).clearContent();
  view.setFrozenRows(1);
  view.getRange(1,1,values.length,MEMBER_COLUMNS.length).setWrap(true).setVerticalAlignment('top');
  view.getRange(1,1,1,MEMBER_COLUMNS.length).setFontWeight('bold').setBackground('#eeeeee');
  view.setColumnWidths(1,MEMBER_COLUMNS.length,180);
  view.setColumnWidth(2,280); view.setColumnWidth(3,240);
  view.setColumnWidth(4,280); view.setColumnWidth(5,420); view.setColumnWidth(22,420);
  if (view.getFilter()) view.getFilter().remove();
  view.getRange(1,1,values.length,MEMBER_COLUMNS.length).createFilter();
  view.getBandings().forEach(function(banding) { banding.remove(); });
  view.getRange(1,1,values.length,MEMBER_COLUMNS.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
}
