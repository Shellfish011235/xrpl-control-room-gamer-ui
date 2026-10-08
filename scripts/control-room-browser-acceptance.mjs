// Run against an explicitly started, fresh-profile Chrome CDP and local demo.
// Does not start/stop services or use a wallet. Failure injection targets gateway only.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const endpoint = process.env.CDP_URL ?? 'http://127.0.0.1:9223';
const url = process.env.CONTROL_ROOM_URL ?? 'http://127.0.0.1:5180/tools/control-room';
for (const value of [endpoint, url]) {
  assert.equal(new URL(value).hostname, '127.0.0.1', 'Acceptance requires loopback');
}
const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; }).catch(async error => {
  await fetch(endpoint + '/json/close/' + target.id).catch(()=>{});
  ws.close();
  throw error;
});
let sequence = 0;
const requests = new Map();
let mode = 'normal';
let held;
const failures = [];
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { requests.delete(id); reject(new Error(method + ' timeout')); }, 15000);
    requests.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
ws.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  if (event.id) {
    const request = requests.get(event.id);
    if (!request) return;
    clearTimeout(request.timer); requests.delete(event.id);
    event.error ? request.reject(new Error(JSON.stringify(event.error))) : request.resolve(event.result);
  } else if (event.method === 'Fetch.requestPaused') {
    const { requestId, request } = event.params;
    let action;
    if (request.method === 'OPTIONS') action = send('Fetch.continueRequest', { requestId });
    else if (mode === 'pending' && request.url.includes('/quote')) { held = requestId; return; }
    else if (mode === 'health-failure' || (mode === 'receipt-failure' && request.url.includes('/receipts/')))
      action = send('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' });
    else action = send('Fetch.continueRequest', { requestId });
    action.catch(error => failures.push(error.message));
  }
};
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const panel = "document.querySelector('section[aria-label=\"Shellfish integration status\"]')";
const state = () => evaluate(`(() => { const p=${panel}; return p ? { text:p.innerText, buttons:[...p.querySelectorAll('button')].map(b=>({text:b.innerText,disabled:b.disabled})), details:!!p.querySelector('details'), alert:p.querySelector('[role=alert]')?.innerText } : null; })()`);
async function wait(predicate, description) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const current = await state();
    if (current && predicate(current)) return current;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(description + ': ' + JSON.stringify(await state()));
}
async function click(label) {
  await evaluate(`(() => { const b=[...${panel}.querySelectorAll('button')].find(b=>b.innerText===${JSON.stringify(label)}); if(!b||b.disabled) throw Error('Button unavailable'); b.click(); })()`);
}
const evidence = [];
const output = 'node_modules/.cache/shellfish-browser-acceptance';
async function capture(name, current) {
  evidence.push({ name, state: current });
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(output + '/' + name + '.png', Buffer.from(shot.data, 'base64'));
  console.log('PASS ' + name);
}
try {
  await mkdir(output, { recursive: true });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:8787/*' }] });
  await send('Page.navigate', { url });
  await capture('healthy', await wait(s => s.text.includes('Shellfish healthy') && s.buttons.every(b=>!b.disabled), 'Healthy panel'));
  await click('Request generic quote');
  await capture('quote-receipt', await wait(s => s.text.includes('QUOTED') && s.details && s.buttons.every(b=>!b.disabled), 'Quote and receipt'));
  mode = 'health-failure';
  await click('Refresh health');
  const down = await wait(s => s.text.includes('Backend unavailable') && s.buttons.every(b=>!b.disabled), 'Backend failure');
  assert.equal(down.details, false); assert.ok(down.text.includes('Idle')); assert.ok(!down.text.includes('QUOTED'));
  await capture('backend-down-clears-stale', down);
  mode = 'normal'; await click('Refresh health');
  await wait(s=>s.text.includes('Shellfish healthy') && s.buttons.every(b=>!b.disabled), 'Recovery');
  mode = 'pending'; await click('Request generic quote');
  const pending = await wait(s=>s.text.includes('Working') && s.buttons.every(b=>b.disabled), 'Pending controls');
  assert.equal(pending.details, false);
  await capture('pending-controls', pending);
  assert.ok(held, 'Gateway quote interception');
  mode = 'normal'; await send('Fetch.continueRequest', { requestId: held }); held = undefined;
  await wait(s=>s.text.includes('QUOTED') && s.details && s.buttons.every(b=>!b.disabled), 'Pending completion');
  mode = 'receipt-failure'; await click('Request generic quote');
  const missing = await wait(s=>s.alert?.includes('Receipt lookup failed') && s.buttons.every(b=>!b.disabled), 'Receipt failure');
  assert.equal(missing.details, false); assert.ok(missing.text.includes('QUOTED'));
  await capture('receipt-failure', missing);
  mode = 'normal'; await click('Queue generic job');
  const queued = await wait(s=>s.text.includes('QUEUED') && s.buttons.every(b=>!b.disabled), 'Queue');
  assert.equal(queued.details, false);
  await capture('queue', queued);
  assert.deepEqual(failures, []);
  await writeFile(output + '/results.json', JSON.stringify({ url, completed: new Date().toISOString(), evidence }, null, 2));
  console.log('All six rendered panel scenarios passed. Generic queue acceptance verified.');
} finally {
  if (held) await send('Fetch.failRequest', { requestId: held, errorReason: 'Aborted' }).catch(()=>{});
  await send('Fetch.disable').catch(()=>{});
  ws.close();
  await fetch(endpoint + '/json/close/' + target.id).catch(()=>{});
}
