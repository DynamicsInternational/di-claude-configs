#!/usr/bin/env node
// Over-structure metrics for an AL app: call depth, relay procedures, events without subscriber,
// dead code, comment noise, single-implementation interfaces, Boolean parameter lists.
// Static, regex-based: an approximation meant to point a reviewer at hotspots, not a compiler.
//
// Usage: node al-metrics.js <appDir> [--level pte|product] [--changed <git-ref>]
//                           [--json <file>] [--md <file>] [--baseline <metrics.json>]
//                           [--ratchet <metrics.json>]   exit 3 when a changed file got worse than in that baseline
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Thresholds live here only — never in the rules (a number in a rule becomes a target).
const THRESHOLDS = {
  depthWarn: 6,          // chain of our own procedures from an entry point
  booleanParamsWarn: 3,  // more than 2 Boolean parameters
  commentRatioWarn: 0.30,
};

const OBJECT_RE = /^\s*(codeunit|table|tableextension|page|pageextension|report|reportextension|xmlport|query|enum|enumextension|interface|permissionset|permissionsetextension|profile|controladdin|entitlement)\s+(\d+\s+)?("[^"]+"|[\w]+)(?:\s+extends\s+("[^"]+"|[\w]+))?(?:\s+implements\s+(.+))?/i;
const PROC_RE = /^\s*(local\s+|internal\s+|protected\s+)?procedure\s+("[^"]+"|\w+)\s*\(/i;
const TRIGGER_RE = /^\s*trigger\s+("[^"]+"|\w+)\s*\(/i;
const VAR_DECL_RE = /("[^"]+"|\w+)\s*:\s*(?:temporary\s+)?(Codeunit|Record|Page|Report|Interface)\s+("[^"]+"|\w+)/gi;
const CALL_RE = /(?:("[^"]+"|\w+)\s*\.\s*)?("[^"]+"|\w+)\s*\(/g;
const HISTORY_RE = /(\b(ADO|DevOps|US|PBI|Bug|Task|Ticket|Jira)\s*[-#:]?\s*\d{3,}|#\d{3,}|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(ajout|modif(ication)?|added|modified|changed)\s+(le|on|by|par)\b)/i;
// Per-file counts the ratchet refuses to see grow in a changed file.
const RATCHET_KEYS = ['maxDepth', 'relays', 'eventsWithoutSubscriber', 'dead', 'singleImplementationInterfaces', 'manyBooleans', 'singleInstance'];
const NOT_CALLS = new Set(['if', 'while', 'until', 'exit', 'case', 'for', 'with', 'not', 'and', 'or', 'xor', 'begin', 'then', 'else', 'of', 'do', 'repeat']);

const unq = s => (s || '').replace(/^"|"$/g, '').trim().toLowerCase();

function parseArgs(argv) {
  const a = { appDir: null, level: null, changed: null, json: null, md: null, baseline: null, ratchet: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--level') a.level = argv[++i];
    else if (k === '--changed') a.changed = argv[++i];
    else if (k === '--json') a.json = argv[++i];
    else if (k === '--md') a.md = argv[++i];
    else if (k === '--baseline') a.baseline = argv[++i];
    else if (k === '--ratchet') a.ratchet = argv[++i];
    else if (!a.appDir) a.appDir = k;
  }
  if (!a.appDir) { console.error('Usage: node al-metrics.js <appDir> [--level pte|product] [--changed <git-ref>] [--json f] [--md f] [--baseline f] [--ratchet f]'); process.exit(2); }
  return a;
}

function listAlFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listAlFiles(p));
    else if (e.name.toLowerCase().endsWith('.al')) out.push(p);
  }
  return out;
}

// Blank out strings and comments (keeping line structure), and collect comment lines.
function stripCode(text) {
  let code = '', i = 0, line = 0;
  const commentLines = new Set(), docParamLines = new Set(), historyLines = new Set();
  const lines = text.split('\n');
  const mark = (ln, s) => {
    commentLines.add(ln);
    if (/^\s*\/\/\/\s*<param\b/i.test(s)) docParamLines.add(ln);
    if (HISTORY_RE.test(s)) historyLines.add(ln);
  };
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (c === '\n') { code += c; line++; i++; continue; }
    if (c === '/' && n === '/') {
      const end = text.indexOf('\n', i); const stop = end < 0 ? text.length : end;
      mark(line, lines[line]); code += ' '.repeat(stop - i); i = stop; continue;
    }
    if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2); const stop = end < 0 ? text.length : end + 2;
      for (let k = i; k < stop; k++) { if (text[k] === '\n') { mark(line, lines[line]); line++; code += '\n'; } else code += ' '; }
      mark(line, lines[line]); i = stop; continue;
    }
    if (c === '\'') {
      let k = i + 1;
      while (k < text.length) { if (text[k] === '\'' && text[k + 1] === '\'') { k += 2; continue; } if (text[k] === '\'' || text[k] === '\n') break; k++; }
      code += '\'' + ' '.repeat(Math.max(0, k - i - 1)) + (text[k] === '\'' ? '\'' : ''); i = text[k] === '\'' ? k + 1 : k; continue;
    }
    code += c; i++;
  }
  return { code, commentLines, docParamLines, historyLines };
}

// Find the begin...end body that starts after `fromLine`; returns [beginLine, endLine] or null.
function findBody(lines, fromLine) {
  let depth = 0, start = -1;
  for (let l = fromLine; l < lines.length; l++) {
    const tokens = lines[l].match(/\b(begin|case|end)\b/gi) || [];
    for (const t of tokens) {
      const tl = t.toLowerCase();
      if (tl === 'begin' || tl === 'case') { if (start < 0 && tl === 'begin') start = l; if (start >= 0) depth++; }
      else if (start >= 0) { depth--; if (depth === 0) return [start, l]; }
    }
    if (start < 0 && l > fromLine && (PROC_RE.test(lines[l]) || TRIGGER_RE.test(lines[l]))) return null;
  }
  return null;
}

function parseApp(appDir) {
  const objects = [];
  const procs = [];
  const comments = { codeLines: 0, commentLines: 0, docParam: 0, history: 0 };
  for (const file of listAlFiles(appDir)) {
    const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
    const rel = path.relative(appDir, file).replace(/\\/g, '/');
    const { code, commentLines, docParamLines, historyLines } = stripCode(raw);
    const rawLines = raw.split('\n');
    const lines = code.split('\n');
    rawLines.forEach((l, i) => { if (l.trim()) { if (commentLines.has(i) && !lines[i].trim()) comments.commentLines++; else comments.codeLines++; } });
    comments.docParam += docParamLines.size; comments.history += historyLines.size;

    let obj = null;
    for (let l = 0; l < lines.length; l++) {
      const om = lines[l].match(OBJECT_RE);
      if (om && !/^\s*(local|internal|procedure|trigger)/i.test(lines[l])) {
        obj = {
          type: om[1].toLowerCase(), name: unq(om[3]), display: om[3].replace(/"/g, ''), file: rel,
          extends: om[4] ? unq(om[4]) : null,
          implements: om[5] ? om[5].split(',').map(unq).filter(Boolean) : [],
          vars: {}, singleInstance: false, sourceTable: null, procs: [],
        };
        objects.push(obj);
        continue;
      }
      if (!obj) continue;
      if (/^\s*SingleInstance\s*=\s*true/i.test(lines[l])) obj.singleInstance = true;
      const st = lines[l].match(/^\s*SourceTable\s*=\s*("[^"]+"|\w+)/i);
      if (st) obj.sourceTable = unq(st[1]);
      for (const m of lines[l].matchAll(VAR_DECL_RE)) obj.vars[unq(m[1])] = { kind: m[2].toLowerCase(), target: unq(m[3]) };

      const pm = lines[l].match(PROC_RE), tm = lines[l].match(TRIGGER_RE);
      if (!pm && !tm) continue;
      // Attributes (possibly multi-line) sit between the previous statement/brace and the declaration.
      const attrs = [];
      for (let k = l - 1; k >= 0; k--) {
        const t = lines[k].trim();
        if (/[;{}]$/.test(t) || /^(end|begin|var)\b/i.test(t)) break;
        attrs.unshift(rawLines[k].trim());
      }
      const attrText = attrs.join(' ');
      // Signature may span lines: collect until the closing parenthesis.
      let sig = '', k = l;
      for (let depth = 0; k < lines.length; k++) {
        const s = k === l ? lines[k].slice(lines[k].indexOf('(')) : lines[k];
        sig += s + ' ';
        for (const ch of s) { if (ch === '(') depth++; else if (ch === ')') depth--; }
        if (depth <= 0) break;
      }
      const params = (sig.match(/\(([\s\S]*)\)/) || [, ''])[1];
      const body = findBody(lines, l);
      const header = body ? lines.slice(l, body[0]).join('\n') : '';
      const locals = {};
      for (const m of header.matchAll(VAR_DECL_RE)) locals[unq(m[1])] = { kind: m[2].toLowerCase(), target: unq(m[3]) };
      const sub = attrText.match(/\[EventSubscriber\s*\(\s*ObjectType::(\w+)\s*,\s*(?:\w+::)?("[^"]+"|\w+)\s*,\s*(?:'([^']+)'|("[^"]+"|\w+))/i);
      const p = {
        obj, name: tm ? unq(tm[1]) : unq(pm[2]), display: (tm ? tm[1] : pm[2]).replace(/"/g, ''),
        access: tm ? 'trigger' : (pm[1] || 'public').trim().toLowerCase(),
        isTrigger: !!tm, line: l + 1, file: rel,
        publisher: /\[(IntegrationEvent|BusinessEvent|InternalEvent)\b/i.test(attrText),
        subscriber: sub ? { objType: sub[1].toLowerCase(), objName: unq(sub[2]), event: unq(sub[3] || sub[4]) } : null,
        isTest: /\[Test\]/i.test(attrText),
        boolParams: (params.match(/:\s*Boolean\b/gi) || []).length,
        isHandled: /\bIsHandled\s*:\s*Boolean/i.test(params),
        locals, bodyText: body ? lines.slice(body[0], body[1] + 1).join('\n') : '',
        bodyLines: body ? body[1] - body[0] + 1 : 0, calls: [],
      };
      obj.procs.push(p); procs.push(p);
      if (body) l = body[1];
    }
  }
  return { objects, procs, comments };
}

function resolve(app) {
  const byObj = new Map();
  for (const o of app.objects) byObj.set(o.type + ':' + o.name, o);
  const extensionsOf = (baseType, name) => app.objects.filter(o => o.type === baseType + 'extension' && o.extends === name);
  const targetsFor = (kind, name) => {
    const base = kind === 'record' ? 'table' : kind;
    const own = byObj.get(base + ':' + name);
    return [own, ...extensionsOf(base, name)].filter(Boolean);
  };
  const findProc = (objs, name) => objs.flatMap(o => o.procs.filter(p => p.name === name && !p.isTrigger));
  const recordOf = o => o.type === 'table' ? o.name : o.type === 'tableextension' ? o.extends : o.sourceTable;

  for (const p of app.procs) {
    const seen = new Set();
    for (const m of p.bodyText.matchAll(CALL_RE)) {
      const q = m[1] ? unq(m[1]) : null, name = unq(m[2]);
      if (!q && NOT_CALLS.has(name)) continue;
      let objs;
      if (!q || q === 'this') objs = [p.obj, ...(p.obj.extends ? targetsFor(p.obj.type.replace('extension', ''), p.obj.extends) : [])];
      else if (q === 'rec' || q === 'xrec') { const r = recordOf(p.obj); objs = r ? targetsFor('record', r) : []; }
      else { const v = p.locals[q] || p.obj.vars[q]; objs = v ? targetsFor(v.kind, v.target) : []; }
      for (const t of findProc(objs, name)) if (t !== p && !seen.has(t)) { seen.add(t); p.calls.push(t); }
      if (!p.firstCall) p.firstCall = { q, name, viaCodeunit: !!(q && (p.locals[q] || p.obj.vars[q] || {}).kind === 'codeunit') };
    }
  }
  const callers = new Map(app.procs.map(p => [p, 0]));
  for (const p of app.procs) for (const t of p.calls) callers.set(t, callers.get(t) + 1);
  return callers;
}

function analyze(app, opts) {
  const callers = resolve(app);
  const id = p => `${p.obj.display}.${p.display}`;
  const loc = p => `${p.file}:${p.line}`;

  // Call depth: longest chain of our procedures from an entry point (trigger, subscriber, uncalled procedure).
  const memo = new Map();
  const longest = (p, stack) => {
    if (memo.has(p)) return memo.get(p);
    if (stack.has(p)) return [p];
    stack.add(p);
    let best = [];
    for (const t of p.calls) { const c = longest(t, stack); if (c.length > best.length) best = c; }
    stack.delete(p);
    const r = [p, ...best]; memo.set(p, r); return r;
  };
  const entries = app.procs.filter(p => p.isTrigger || p.subscriber || callers.get(p) === 0);
  const chains = entries.map(p => longest(p, new Set())).sort((a, b) => b.length - a.length);
  const deepChains = [];
  for (const c of chains) { if (deepChains.some(d => d[0] === c[0])) continue; deepChains.push(c); if (deepChains.length === 5) break; }

  // Relays: a procedure whose whole body is one call to another procedure.
  const relays = app.procs.filter(p => {
    if (p.isTrigger || p.subscriber || p.publisher || p.isTest || !p.bodyText) return false;
    const inner = p.bodyText.replace(/^\s*begin\b/i, '').replace(/\bend\s*;?\s*$/i, '');
    const stmts = inner.split(';').map(s => s.trim()).filter(Boolean);
    if (stmts.length !== 1) return false;
    const isExit = /^exit\s*\(/i.test(stmts[0]);
    const s = stmts[0].replace(/^exit\s*\(\s*/i, '');
    const head = s.match(/^("[^"]+"|\w+)(\s*\.\s*("[^"]+"|\w+))?\s*\(/);
    if (!head) return false;
    // The statement must be the call and nothing else: `exit(F(x) = 1)` adds logic, it is not a relay.
    let depth = 0, k = head[0].length - 1;
    for (; k < s.length; k++) { if (s[k] === '(') depth++; else if (s[k] === ')' && --depth === 0) break; }
    if (s.slice(k + 1).replace(/\s/g, '') !== (isExit ? ')' : '')) return false;
    return p.calls.length === 1 || (p.firstCall && p.firstCall.viaCodeunit);
  });

  // Events: publishers in this app vs subscribers in this app.
  const subscribed = new Set(app.procs.filter(p => p.subscriber).map(p => p.subscriber.objName + '|' + p.subscriber.event));
  const publishers = app.procs.filter(p => p.publisher);
  const unconsumed = publishers.filter(p => !subscribed.has(p.obj.name + '|' + p.name));
  const isHandled = publishers.filter(p => p.isHandled);

  // Dead code: local/internal procedures nobody calls (name-based, conservative: any textual call counts).
  const allBodies = app.procs.map(p => p.bodyText).join('\n').toLowerCase();
  const textuallyCalled = name => new RegExp(`(^|[^\\w"])"?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?\\s*\\(`, 'i').test(allBodies);
  const dead = app.procs.filter(p => (p.access === 'local' || p.access === 'internal') && !p.publisher && !p.subscriber
    && callers.get(p) === 0 && !textuallyCalled(p.name));
  const unreferencedPublic = app.procs.filter(p => p.access === 'public' && !p.publisher && !p.subscriber && !p.isTest
    && !p.obj.implements.length && p.obj.type !== 'interface' && callers.get(p) === 0 && !textuallyCalled(p.name));

  // Interfaces with a single implementation.
  const interfaces = app.objects.filter(o => o.type === 'interface');
  const singleImpl = interfaces.map(i => ({ i, impls: app.objects.filter(o => o.implements.includes(i.name)) }))
    .filter(x => x.impls.length <= 1);

  const boolHeavy = app.procs.filter(p => p.boolParams >= THRESHOLDS.booleanParamsWarn);
  const singleInstance = app.objects.filter(o => o.singleInstance);

  const c = app.comments;
  const commentRatio = c.commentLines / Math.max(1, c.commentLines + c.codeLines);

  // Per-file counts: what the ratchet compares between a baseline and the current scan.
  const perFile = {};
  const bump = (file, k, n = 1) => {
    const e = perFile[file] || (perFile[file] = Object.fromEntries(RATCHET_KEYS.map(r => [r, 0])));
    e[k] = k === 'maxDepth' ? Math.max(e[k], n) : e[k] + n;
  };
  for (const ch of chains) bump(ch[0].file, 'maxDepth', ch.length);
  relays.forEach(p => bump(p.file, 'relays'));
  unconsumed.forEach(p => bump(p.file, 'eventsWithoutSubscriber'));
  dead.forEach(p => bump(p.file, 'dead'));
  singleImpl.forEach(x => bump(x.i.file, 'singleImplementationInterfaces'));
  boolHeavy.forEach(p => bump(p.file, 'manyBooleans'));
  singleInstance.forEach(o => bump(o.file, 'singleInstance'));

  const list = (arr, f) => arr.map(f);
  return {
    generated: new Date().toISOString(),
    scope: { objects: app.objects.length, procedures: app.procs.filter(p => !p.isTrigger).length, triggers: app.procs.filter(p => p.isTrigger).length, level: opts.level || 'unknown' },
    thresholds: THRESHOLDS,
    metrics: {
      maxCallDepth: deepChains.length ? deepChains[0].length : 0,
      relayProcedures: relays.length,
      eventPublishers: publishers.length,
      eventsWithoutSubscriberInApp: unconsumed.length,
      isHandledPublishers: isHandled.length,
      deadLocalOrInternal: dead.length,
      unreferencedPublic: unreferencedPublic.length,
      commentRatio: Math.round(commentRatio * 1000) / 1000,
      docParamLines: c.docParam,
      historyComments: c.history,
      interfaces: interfaces.length,
      singleImplementationInterfaces: singleImpl.length,
      procsWithManyBooleans: boolHeavy.length,
      singleInstanceCodeunits: singleInstance.length,
    },
    perFile,
    details: {
      deepestChains: deepChains.map(ch => ({ depth: ch.length, chain: ch.map(id), start: loc(ch[0]) })),
      relays: list(relays, p => ({ proc: id(p), at: loc(p), file: p.file })),
      eventsWithoutSubscriber: list(unconsumed, p => ({ event: id(p), at: loc(p), file: p.file, isHandled: p.isHandled })),
      dead: list(dead, p => ({ proc: id(p), access: p.access, at: loc(p), file: p.file })),
      unreferencedPublic: list(unreferencedPublic, p => ({ proc: id(p), at: loc(p), file: p.file })),
      singleImplementationInterfaces: singleImpl.map(x => ({ interface: x.i.display, file: x.i.file, implementations: x.impls.map(o => o.display) })),
      manyBooleans: list(boolHeavy, p => ({ proc: id(p), booleans: p.boolParams, at: loc(p), file: p.file })),
      singleInstance: singleInstance.map(o => ({ object: o.display, file: o.file })),
    },
  };
}

function changedFiles(appDir, ref) {
  const r = spawnSync('git', ['diff', '--name-only', '--relative', ref, '--', '.'], { cwd: appDir, encoding: 'utf8' });
  if (r.status !== 0) { console.error(`git diff ${ref} failed: ${r.stderr}`); return null; }
  return new Set(r.stdout.split(/\r?\n/).filter(f => f.toLowerCase().endsWith('.al')));
}

// Files (changed ones when --changed is given) whose per-file counts grew against the baseline.
// Events without subscriber only count on a PTE: on a Product app they are the public surface.
function ratchet(res, base, changed, level) {
  if (!base.perFile) throw new Error('ratchet baseline has no perFile section — regenerate it with this version of al-metrics');
  const keys = RATCHET_KEYS.filter(k => k !== 'eventsWithoutSubscriber' || level !== 'product');
  const files = changed ? [...changed] : Object.keys(res.perFile);
  const regressions = [];
  for (const f of files) {
    const cur = res.perFile[f], old = base.perFile[f] || {};
    if (!cur) continue;
    for (const k of keys) if ((cur[k] || 0) > (old[k] || 0)) regressions.push({ file: f, metric: k, before: old[k] || 0, after: cur[k] });
  }
  return regressions;
}

function toMarkdown(res, opts, baseline, changed) {
  const m = res.metrics, b = baseline && baseline.metrics;
  const delta = k => !b || b[k] === undefined ? '' : (m[k] - b[k] === 0 ? ' (=)' : ` (${m[k] - b[k] > 0 ? '+' : ''}${Math.round((m[k] - b[k]) * 1000) / 1000})`);
  const lvl = (opts.level || '').toLowerCase();
  const flag = (cond) => cond ? ' ⚠' : '';
  const rows = [
    ['Max call depth', 'maxCallDepth', m.maxCallDepth >= THRESHOLDS.depthWarn],
    ['Relay procedures (body = one call)', 'relayProcedures', m.relayProcedures > 0],
    ['Event publishers', 'eventPublishers', false],
    ['…without subscriber in this app', 'eventsWithoutSubscriberInApp', lvl === 'pte' && m.eventsWithoutSubscriberInApp > 0],
    ['…with IsHandled', 'isHandledPublishers', false],
    ['Dead local/internal procedures', 'deadLocalOrInternal', m.deadLocalOrInternal > 0],
    ['Unreferenced public procedures', 'unreferencedPublic', false],
    ['Comment ratio', 'commentRatio', m.commentRatio >= THRESHOLDS.commentRatioWarn],
    ['`/// <param>` lines', 'docParamLines', false],
    ['History comments (tickets, dates)', 'historyComments', m.historyComments > 0],
    ['Single-implementation interfaces', 'singleImplementationInterfaces', m.singleImplementationInterfaces > 0],
    ['Procedures with ≥3 Boolean params', 'procsWithManyBooleans', m.procsWithManyBooleans > 0],
    ['SingleInstance codeunits', 'singleInstanceCodeunits', false],
  ];
  const out = [];
  out.push('# AL Structure Metrics', '');
  out.push(`${res.scope.objects} objects · ${res.scope.procedures} procedures · ${res.scope.triggers} triggers · Extensibility Level: ${res.scope.level}`);
  out.push('', 'Static approximation (regex-based). ⚠ = worth a look, not a failure.', '');
  out.push('| Metric | Value |', '|---|---|');
  for (const [label, k, warn] of rows) out.push(`| ${label} | ${m[k]}${delta(k)}${flag(warn)} |`);
  if (lvl !== 'pte' && m.eventsWithoutSubscriberInApp) out.push('', '_Events without subscriber are expected on a Product app (public extensibility); on a PTE each one needs a reason._');

  const inScope = f => !changed || changed.has(f);
  const section = (title, items, fmt) => {
    const sel = items.filter(x => inScope(x.file || (x.start || '').split(':')[0]));
    if (!sel.length) return;
    out.push('', `## ${title}${changed ? ' (changed files)' : ''}`, '');
    for (const x of sel.slice(0, 25)) out.push('- ' + fmt(x));
    if (sel.length > 25) out.push(`- … ${sel.length - 25} more (see JSON)`);
  };
  if (res.ratchet) {
    out.push('', '## Ratchet', '');
    if (!res.ratchet.length) out.push('No regression in the changed files.');
    else for (const r of res.ratchet) out.push(`- ⛔ ${r.file} — ${r.metric}: ${r.before} → ${r.after}`);
  }
  const d = res.details;
  section('Deepest call chains', d.deepestChains.map(x => ({ ...x, file: x.start.split(':')[0] })), x => `depth ${x.depth} — ${x.chain.join(' → ')} (${x.start})`);
  section('Relay procedures', d.relays, x => `${x.proc} (${x.at})`);
  section('Events without subscriber in this app', d.eventsWithoutSubscriber, x => `${x.event}${x.isHandled ? ' [IsHandled]' : ''} (${x.at})`);
  section('Dead local/internal procedures', d.dead, x => `${x.proc} — ${x.access} (${x.at})`);
  section('Single-implementation interfaces', d.singleImplementationInterfaces, x => `${x.interface} → ${x.implementations.join(', ') || 'none'} (${x.file})`);
  section('Procedures with many Boolean parameters', d.manyBooleans, x => `${x.proc} — ${x.booleans} Booleans (${x.at})`);
  section('SingleInstance codeunits', d.singleInstance, x => `${x.object} (${x.file})`);
  return out.join('\n') + '\n';
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const appDir = path.resolve(opts.appDir);
  if (!opts.level) {
    const ctx = [path.join(appDir, '.dev', 'project-context.md'), path.join(appDir, '..', '.dev', 'project-context.md')].find(f => fs.existsSync(f));
    const m = ctx && fs.readFileSync(ctx, 'utf8').match(/Extensibility Level[^\n]*?\b(PTE|Product)\b/i);
    if (m) opts.level = m[1].toLowerCase();
  }
  const res = analyze(parseApp(appDir), opts);
  const baseline = opts.baseline ? JSON.parse(fs.readFileSync(opts.baseline, 'utf8')) : null;
  const changed = opts.changed ? changedFiles(appDir, opts.changed) : null;
  if (opts.ratchet) res.ratchet = ratchet(res, JSON.parse(fs.readFileSync(opts.ratchet, 'utf8')), changed, (opts.level || '').toLowerCase());
  const md = toMarkdown(res, opts, baseline, changed);
  if (opts.json) fs.writeFileSync(opts.json, JSON.stringify(res, null, 2));
  if (opts.md) fs.writeFileSync(opts.md, md);
  if (!opts.md) process.stdout.write(md);
  if (res.ratchet && res.ratchet.length) process.exit(3);
}

main();
