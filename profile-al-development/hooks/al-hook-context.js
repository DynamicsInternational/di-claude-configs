#!/usr/bin/env node
// SessionStart / SubagentStart hook: injects the profile's instruction files into context.
// Claude Code does not load a plugin's CLAUDE.md or rules/ directory, so the lead instructions
// and the AL rules reach the main session and every subagent through this hook instead.
// Usage: node al-hook-context.js <SessionStart|SubagentStart> <file> [<file>...]   (paths relative to the plugin root)
// Silent outside an AL project (no app.json in cwd or one level below, no .dev/project-context.md).
const fs = require('fs');
const path = require('path');

// Agents that only search or answer Claude Code questions — they never design or write AL.
const SKIPPED_AGENTS = new Set(['Explore', 'claude-code-guide', 'statusline-setup']);
const MAX_CHARS = 10000; // Claude Code truncates a longer additionalContext to a file path + preview.

function isAlProject(dir) {
  if (fs.existsSync(path.join(dir, 'app.json'))) return true;
  if (fs.existsSync(path.join(dir, '.dev', 'project-context.md'))) return true;
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .some(e => e.isDirectory() && !e.name.startsWith('.') && fs.existsSync(path.join(dir, e.name, 'app.json')));
  } catch { return false; }
}

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function run(raw) {
  const [event, ...files] = process.argv.slice(2);
  let data = {};
  try { data = JSON.parse(raw); } catch { /* no input: use process cwd */ }

  if (event === 'SubagentStart' && SKIPPED_AGENTS.has(String(data.agent_type || '').replace(/^.*:/, ''))) return;
  if (!isAlProject(data.cwd || process.cwd())) return;

  const root = path.resolve(__dirname, '..');
  const text = files.map(f => stripFrontmatter(fs.readFileSync(path.join(root, f), 'utf8'))).join('\n\n');
  if (text.length > MAX_CHARS) process.stderr.write(`al-hook-context: ${files.join(', ')} is ${text.length} chars (> ${MAX_CHARS}), it will be truncated\n`);

  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => { try { run(input); } catch { /* never block a session */ } process.exit(0); });
process.stdin.on('error', () => process.exit(0));
