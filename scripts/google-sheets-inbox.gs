/** @OnlyCurrentDoc */
// Bound to the private Interaction Club spreadsheet. Set WEBHOOK_SECRET in Script Properties.
// Deploy as owner, callable by the website server. Never put the secret in client code.
function doPost(event) {
  var result;
  try {
    var body = JSON.parse(event.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!secret || body.secret !== secret) throw new Error('Unauthorized');
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(body.id || '')) throw new Error('Invalid ID');
    var record = body.record;
    if (!record || record.id !== body.id) throw new Error('Invalid record');
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(body.kind === 'response' ? 'RESPONSES' : body.kind === 'group' ? 'GROUPS' : '');
    if (!sheet) throw new Error('Unknown record type');
    var list = function(value) { return Array.isArray(value) ? value.join(', ') : ''; };
    var values = body.kind === 'response' ? [record.id,record.submittedAt,record.fullName,record.email,record.baseArea,record.birthMonth,record.birthYear,record.ageConfirmed,record.gender,list(record.tableFormats),list(record.activities),record.budget,record.maxSpend,list(record.availability),record.intent,record.discipline,list(record.interests),record.vibe,[list(record.foodLikeTags),record.foodLikes].filter(Boolean).join(', '),[list(record.foodDislikeTags),record.foodDislikes].filter(Boolean).join(', '),list(record.dietaryNeeds),record.dietaryOther,record.accessibilityNotes,record.spontaneous,record.agreement] : [record.id,record.status,record.activity,record.intent,record.startsAt,record.endsAt,record.venueName,record.venueAddress,record.venueArea,record.cost,record.costDetails,record.format,record.hosted,record.hostName,record.sponsorDisclosure,record.dressCode,record.venueNotes,record.responseDeadline,(record.members||[]).map(function(m){return m.applicationId;}).join(', '),(record.members||[]).map(function(m){return m.applicationId+': '+m.rsvp;}).join(', ')];
    values = values.map(function(v) { if (v === undefined || v === null) return ''; if (typeof v === 'string' && /^[=+@-]/.test(v)) return "'"+v; return v; });
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var last = sheet.getLastRow();
      var found = last > 1 ? sheet.getRange(2,1,last-1,1).createTextFinder(body.id).matchEntireCell(true).findNext() : null;
      // ID upsert makes retry safe; response organizer columns Z:AB are never overwritten.
      var row = found ? found.getRow() : last+1;
      if (body.kind === 'response') {
        ensureCommunityColumns(sheet, ['Community affiliations (self-reported)', 'Other community', 'Wider community opt-in', 'Referral source']);
        // Resolve columns by header so reorganizing the tracker never misroutes answers.
        var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
        var oldHeaders = ['ID','Submitted','Full name','Email','Based in','Birth month','Birth year','Age confirmed','Gender','Table formats','Activities','Budget tier','Max spend','Availability','Evening intent','Discipline','Interests','Dress preference','Food likes','Food dislikes','Dietary tags','Other dietary needs','Accessibility','Spontaneous opt-in','Agreement'];
        var fields = {};
        fields['Community affiliations (self-reported)'] = list(record.affiliations);
        fields['Other community'] = record.communityOther || '';
        fields['Wider community opt-in'] = record.crossCommunityOptIn === true ? 'Yes' : record.crossCommunityOptIn === false ? 'No' : 'Not recorded';
        fields['Referral source'] = record.referralSource || record.invitedBy || '';
        oldHeaders.forEach(function(header,index) { fields[header] = values[index]; });
        var blurb = String(record.discipline || '').split('\n').filter(function(line) {
          return !/^Photo permissions \(\d{4}-\d{2}-\d{2}-v\d+;/.test(line) && !/^Participation terms accepted: \d{4}-\d{2}-\d{2}-v\d+;/.test(line);
        }).join('\n');
        fields['About you'] = fields['Discipline'] = blurb;
        fields['Original show-up agreement'] = values[24];
        var terms = record.termsAcceptance;
        var photo = record.photoConsent;
        var hasTerms = terms && typeof terms.version === 'string' && typeof terms.acceptedAt === 'string';
        fields['Terms & conditions'] = hasTerms ? 'Yes' : 'No answer';
        fields['Show-up agreement'] = hasTerms && typeof record.agreement === 'boolean' ? (record.agreement ? 'Yes' : 'No') : 'No answer';
        var photoChoices = photo && [photo.capture,photo.hackathon,photo.publicPosting];
        fields['Photo release'] = !photoChoices || !photoChoices.every(function(v) { return typeof v === 'boolean'; }) ? 'No answer' : photoChoices.every(function(v) { return v; }) ? 'Yes' : photoChoices.every(function(v) { return !v; }) ? 'No' : 'Custom choices';
        fields['Consent details'] = [hasTerms ? 'Terms: '+terms.version+'; '+terms.acceptedAt : '',photo && photo.version ? 'Photos: '+photo.version+'; '+(photo.acceptedAt || photo.recordedAt || '')+'; capture '+photo.capture+'; presentations '+photo.hackathon+'; public posting '+photo.publicPosting : ''].filter(Boolean).join('\n');
        var week = record.pilotWeekAvailability;
        if (week) {
          fields['Availability window start'] = week.startsOn || '';
          fields['Availability window end'] = week.endsOn || '';
          fields['Available Oct 6–10?'] = week.available === true;
        }
        headers.forEach(function(header,index) {
          if (!Object.prototype.hasOwnProperty.call(fields,header)) return;
          var value = fields[header];
          if (value === undefined || value === null) value = '';
          if (typeof value === 'string' && /^[=+@-]/.test(value)) value = "'"+value;
          sheet.getRange(row,index+1,1,1).setValues([[value]]);
        });
      } else {
        sheet.getRange(row,1,1,values.length).setValues([values]);
        ensureCommunityColumns(sheet, ['Event scope', 'Closed community']);
        var groupHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
        ['Event scope', 'Closed community'].forEach(function(header) {
          var value = header === 'Event scope' ? record.eventScope || 'Legacy / unchanged' : record.community || '';
          if (/^[=+@-]/.test(value)) value = "'"+value;
          sheet.getRange(row,groupHeaders.indexOf(header)+1,1,1).setValues([[value]]);
        });
      }
    } finally { lock.releaseLock(); }
    result = {ok:true,id:body.id};
  } catch (error) { result = {ok:false,error:String(error.message || error)}; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// Append named columns without moving or overwriting existing organizer columns.
function ensureCommunityColumns(sheet, names) {
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  names.forEach(function(name) {
    if (headers.indexOf(name) !== -1) return;
    headers.push(name);
    if (typeof sheet.getMaxColumns === 'function' && headers.length > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    sheet.getRange(1,headers.length,1,1).setValues([[name]]);
  });
}
