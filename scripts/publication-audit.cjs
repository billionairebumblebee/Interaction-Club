// Read-only audit: prints file paths and finding types, never matched secret values.
// Heuristic checks require manual review and do not certify a repository safe.
const fs = require('node:fs');
const cp = require('node:child_process');
const git = args => cp.execFileSync('git', args, { maxBuffer: 256 * 1024 * 1024 });
const patterns = [
  ['credential-like', /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|vercel_blob_rw_[A-Za-z0-9_]{15,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/],
  ['nonempty-secret-assignment', /(?:BLOB_READ_WRITE_TOKEN|GOOGLE_SHEETS_WEBHOOK_SECRET|INTERACTION_ADMIN_KEY)[ \t]*[=:][ \t]*["']?(?!process\.|$)[A-Za-z0-9_-]{16,}/m],
  ['private-local-path', /C:[\\/](?:Users|Documents)[\\/]/i],
  ['participant-record-shape', /"fullName"\s*:\s*"[^"\n]+"[\s\S]{0,200}"email"\s*:\s*"[^"\n]+"/],
];
const results = new Map();
function inspect(scope, path, buffer) {
  if (buffer.includes(0)) { if (/recruiter|screenshot|response|participant|with-notes/i.test(path)) results.set(`${scope}:${path}:private-asset-review`, true); return; }
  const text = buffer.toString('utf8');
  for (const [kind, regex] of patterns) if (regex.test(text)) results.set(`${scope}:${path}:${kind}`, true);
}
const files = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).toString().split('\0').filter(Boolean);
for (const path of new Set(files)) { if (fs.existsSync(path) && fs.statSync(path).isFile()) inspect('current', path, fs.readFileSync(path)); }
const objects = new Map();
for (const line of git(['rev-list', '--objects', '--all']).toString().trim().split('\n')) { const space = line.indexOf(' '); if (space > 0) objects.set(line.slice(0, space), line.slice(space + 1)); }
const hashes = [...objects.keys()];
const batch = cp.execFileSync('git', ['cat-file', '--batch'], { input: hashes.join('\n') + '\n', maxBuffer: 512 * 1024 * 1024 });
let cursor = 0, blobCount = 0;
for (const hash of hashes) {
  const newline = batch.indexOf(10, cursor); const header = batch.subarray(cursor, newline).toString(); const [, type, sizeText] = header.split(' '); const size = Number(sizeText); cursor = newline + 1;
  if (type === 'blob') { blobCount++; inspect('history', objects.get(hash), batch.subarray(cursor, cursor + size)); }
  cursor += size + 1;
}
console.log(`Read-only scan: ${new Set(files).size} current files; ${blobCount} historical blobs across all local refs.`);
for (const finding of [...results.keys()].sort()) console.log(finding);
console.log(`REVIEW REQUIRED: ${results.size} path/type findings. Validate false positives, encoded secrets, screenshots and PDFs manually before publication.`);
