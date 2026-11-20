import { describe, it, expect } from 'vitest';
import { appendQueryParam } from './queryParam';

describe('appendQueryParam', () => {
  it('starts or extends the query string', () => {
    expect(appendQueryParam('http://a.com', 'k', 'v')).toBe('http://a.com?k=v');
    expect(appendQueryParam('http://a.com?q=1', 'k', 'v')).toBe('http://a.com?q=1&k=v');
    expect(appendQueryParam('http://a.com?', 'k', 'v')).toBe('http://a.com?k=v');
  });

  it('keeps {{variables}} intact so the environment can fill them in', () => {
    expect(appendQueryParam('http://a.com', 'api_key', '{{apiKey}}')).toBe('http://a.com?api_key={{apiKey}}');
    expect(appendQueryParam('http://a.com', 'k', 'pre {{ x }}&')).toBe('http://a.com?k=pre%20{{ x }}%26');
  });

  it('puts the param before the #fragment', () => {
    expect(appendQueryParam('http://a.com/p?q=1#top', 'k', 'v')).toBe('http://a.com/p?q=1&k=v#top');
  });

  it('encodes the key as well as the value', () => {
    expect(appendQueryParam('http://a.com', 'my key', 'a&b=c')).toBe('http://a.com?my%20key=a%26b%3Dc');
  });
});
