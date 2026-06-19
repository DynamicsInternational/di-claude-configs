#!/usr/bin/env node
// Stop hook: compiles all AL projects touched in this turn.
// Cross-platform (Node) port of al-hook-compile.sh — no bash / jq / POSIX deps.
// Reads project roots from the queue file, runs al-compile for each, feeds errors back.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// al-compile ships as a platform-specific launcher: a PowerShell script (.ps1)
// on Windows, a plain executable on Unix. Invoke it accordingly.
function runAlCompile(cwd) {
  if (process.platform === 'win32') {
    return spawnSync('pwsh', ['-NoProfile', '-Command', 'al-compile --quiet; exit $LASTEXITCODE'],
      { cwd, encoding: 'utf8' });
  }
  return spawnSync('al-compile', ['--quiet'], { cwd, encoding: 'utf8' });
}

function run(raw) {
  let sessionId = 'default';
  try { const sid = JSON.parse(raw).session_id; if (sid) sessionId = sid; } catch { /* keep default */ }

  const user = process.env.USER || process.env.USERNAME || 'default';
  const queueFile = path.join(os.tmpdir(), `al-compile-queue-${user}-${sessionId}`);
  if (!fs.existsSync(queueFile)) return 0;

  // Deduplicate project roots
  const projects = [...new Set(
    fs.readFileSync(queueFile, 'utf8').split(/\r?\n/).filter(Boolean)
  )];
  try { fs.unlinkSync(queueFile); } catch { /* ignore */ }
  if (projects.length === 0) return 0;

  let hadErrors = false;
  for (const projectDir of projects) {
    try { if (!fs.statSync(projectDir).isDirectory()) continue; } catch { continue; }

    let name = 'unknown';
    try { name = JSON.parse(fs.readFileSync(path.join(projectDir, 'app.json'), 'utf8')).name || 'unknown'; }
    catch { /* keep unknown */ }

    const res = runAlCompile(projectDir);

    // al-compile not installed / not found: skip silently rather than block.
    if (res.error) continue;

    if (res.status === 0) {
      process.stdout.write(`AL compilation OK: ${name}\n`);
    } else {
      hadErrors = true;
      const out = (res.stderr || '') + (res.stdout || '');
      process.stderr.write(`AL compilation FAILED: ${name}\n${out}\n\nFix the above compilation errors.\n`);
    }
  }

  // Exit 2 = rewake Claude with the output so it fixes errors; 0 = clean / nothing to do.
  return hadErrors ? 2 : 0;
}

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => { try { process.exit(run(input)); } catch { process.exit(0); } });
process.stdin.on('error', () => process.exit(0));
