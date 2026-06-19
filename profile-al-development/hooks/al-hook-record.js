#!/usr/bin/env node
// PostToolUse hook: records AL project roots when .al files are edited.
// Cross-platform (Node) port of al-hook-record.sh — no bash / jq / POSIX deps.
// Reads tool call info from stdin as JSON, appends the project root to a queue file.
const fs = require('fs');
const path = require('path');
const os = require('os');

function run(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return 0; }

  const sessionId = data.session_id || 'default';
  const user = process.env.USER || process.env.USERNAME || 'default';
  const queueFile = path.join(os.tmpdir(), `al-compile-queue-${user}-${sessionId}`);

  const filePath = data.tool_input && data.tool_input.file_path;
  if (!filePath) return 0;
  if (!filePath.endsWith('.al')) return 0;
  if (!fs.existsSync(filePath)) return 0;

  // Walk up from the file to find app.json
  let dir = path.dirname(path.resolve(filePath));
  while (dir) {
    if (fs.existsSync(path.join(dir, 'app.json'))) {
      fs.appendFileSync(queueFile, dir + os.EOL);
      return 0;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return 0;
}

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => { try { process.exit(run(input)); } catch { process.exit(0); } });
process.stdin.on('error', () => process.exit(0));
