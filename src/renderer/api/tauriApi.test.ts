import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...a: unknown[]) => invoke(...a) }));

import { installNativeApi } from './tauriApi';

const send = (data: any) => (window as any).pingAPI.makeRequest(data);

describe('makeRequest interpolation', () => {
  beforeEach(() => {
    invoke.mockReset();
    invoke.mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, body: '' });
    installNativeApi();
  });

  it('resolves own environment variables', async () => {
    await send({ url: 'https://x.test/{{token}}', environment: { token: 'abc' } });
    expect(invoke.mock.calls[0][1].req.url).toBe('https://x.test/abc');
  });

  it('keeps placeholders named after Object.prototype members untouched', async () => {
    await send({
      url: 'https://x.test/{{constructor}}/{{toString}}/{{__proto__}}',
      headers: [{ key: 'X-A', value: '{{hasOwnProperty}}' }],
      environment: {},
    });
    const req = invoke.mock.calls[0][1].req;
    expect(req.url).toBe('https://x.test/{{constructor}}/{{toString}}/{{__proto__}}');
    expect(req.headers[0].value).toBe('{{hasOwnProperty}}');
  });
});
