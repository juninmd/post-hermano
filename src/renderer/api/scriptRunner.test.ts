import { describe, it, expect } from 'vitest';
import { runScript } from './scriptRunner';

const res = { code: 200, status: 'OK', headers: {}, text: '{"a":1}' };

describe('runScript', () => {
  it('returns untouched env for empty script', () => {
    expect(runScript('', { a: '1' }).environment).toEqual({ a: '1' });
  });

  it('sets environment variables', () => {
    const out = runScript("pm.environment.set('t', 5)", {});
    expect(out.environment.t).toBe('5');
  });

  it('records passing and failing tests', () => {
    const out = runScript(
      "pm.test('ok',()=>pm.expect(pm.response.code).to.equal(200)); pm.test('bad',()=>pm.expect(pm.response.json().a).to.equal(2))",
      {}, res);
    expect(out.tests.map(t => t.passed)).toEqual([true, false]);
    expect(out.tests[1].error).toContain('to equal');
  });

  it('captures console output and script errors', () => {
    const out = runScript("console.log('hi'); throw new Error('boom')", {});
    expect(out.logs[0]).toEqual({ level: 'log', messages: ['hi'] });
    expect(out.error).toBe('boom');
  });
});

describe('pm.expect().to.eql', () => {
  const eql = (a: string, b: string) => runScript(`pm.test('t', () => pm.expect(${a}).to.eql(${b}))`, {}).tests[0];

  it('treats objects with the same members in another key order as equal', () => {
    expect(eql('{a:1,b:{c:[1,2],d:2}}', '{b:{d:2,c:[1,2]},a:1}').passed).toBe(true);
  });

  it('still fails on different values, array order or extra keys', () => {
    expect(eql('{a:1}', '{a:2}').passed).toBe(false);
    expect(eql('[1,2]', '[2,1]').passed).toBe(false);
    expect(eql('{a:1}', '{a:1,b:2}').passed).toBe(false);
    expect(eql('{a:undefined}', '{}').passed).toBe(false);
    expect(eql('[1]', '{0:1}').passed).toBe(false);
    expect(eql('null', '{}').passed).toBe(false);
  });
});

describe('pm.environment.get', () => {
  it('returns undefined for inherited Object keys', () => {
    const out = runScript("pm.test('k', () => pm.expect(pm.environment.get('constructor')).to.equal(undefined))", {});
    expect(out.tests[0]).toEqual({ name: 'k', passed: true, error: null });
  });
});
