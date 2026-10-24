import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs, viewportNames, classifyScreenshot, findingsFromDom, conciseSummary } from '../whip-ui/scripts/visual-qa.mjs';
const cli = fileURLToPath(new URL('../whip-ui/scripts/visual-qa.mjs', import.meta.url));
test('standard desktop/mobile', () => assert.deepEqual(viewportNames(parseArgs(['--url','http://localhost:3000'])),['desktop','mobile']));
test('focused route', () => {
  assert.throws(()=>parseArgs(['--url','http://localhost:3000','--profile','focused']),/requires --selector/);
  assert.deepEqual(viewportNames(parseArgs(['--url','http://localhost:3000','--profile','focused','--selector','#hero','--viewport','mobile'])),['mobile']);
});
test('reject remote and malformed inputs', () => {
  assert.throws(()=>parseArgs(['--url','https://example.com']),/loopback/);
  assert.throws(()=>parseArgs(['--url','file:///etc/passwd']),/loopback/);
  assert.throws(()=>parseArgs(['--url','http://localhost','--timeout','3']),/timeout/);
});
test('dom findings', () => assert.deepEqual(findingsFromDom({documentWidth:700,viewportWidth:390,brokenImages:['bad.png']},'mobile').map(x=>x.kind),['horizontal-overflow','broken-image']));
test('hash classification', () => {
  const p={screenshots:[{key:'desktop',sha256:'abc'}]};
  assert.equal(classifyScreenshot('abc','desktop',p),'unchanged');
  assert.equal(classifyScreenshot('xyz','desktop',p),'changed');
  assert.equal(classifyScreenshot('abc','mobile',p),'uncompared');
});
test('summary disclaims visual quality',()=>assert.match(conciseSummary({reportPath:'report.json',screenshots:[],issues:[]}),/NOT verified: aesthetics/));
test('help without dependencies',()=>{
  const r=spawnSync(process.execPath,[cli,'--help'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
});
