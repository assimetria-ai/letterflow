/**
 * Test: HTML-escape personalization values in email sender
 * Task #11187 - Verify personalizeContent() escapes subscriber data in HTML context
 */

const { escapeHtml, personalizeContent } = require('../../../../@custom/scheduler/sender');

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#39;world&#39;');
  });

  it('returns falsy values as-is', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe(null);
    expect(escapeHtml(undefined)).toBe(undefined);
  });
});

describe('personalizeContent', () => {
  const maliciousSubscriber = {
    name: '<img src=x onerror=alert(1)> Bob',
    email: '"><script>steal()</script>@evil.com'
  };

  const normalSubscriber = {
    name: 'Jane Doe',
    email: 'jane@example.com'
  };

  it('escapes subscriber name in HTML mode', () => {
    const result = personalizeContent('Hello {{name}}!', maliciousSubscriber, { isHtml: true });
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<script');
    expect(result).toContain('&lt;img');
  });

  it('escapes subscriber email in HTML mode', () => {
    const result = personalizeContent('Email: {{email}}', maliciousSubscriber, { isHtml: true });
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes first_name in HTML mode', () => {
    const result = personalizeContent('Hi {{first_name}}', maliciousSubscriber, { isHtml: true });
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('does NOT escape in plain text mode', () => {
    const result = personalizeContent('Hello {{name}}!', maliciousSubscriber, { isHtml: false });
    expect(result).toContain('<img src=x onerror=alert(1)> Bob');
  });

  it('defaults to HTML mode (isHtml=true)', () => {
    const result = personalizeContent('Hello {{name}}!', maliciousSubscriber);
    expect(result).not.toContain('<img');
  });

  it('works normally for safe subscriber data', () => {
    const result = personalizeContent('Hello {{first_name}}, your email is {{email}}', normalSubscriber, { isHtml: true });
    expect(result).toBe('Hello Jane, your email is jane@example.com');
  });

  it('uses fallback when name is missing', () => {
    const result = personalizeContent('Hi {{first_name}} ({{name}})', { email: 'a@b.com' }, { isHtml: true });
    expect(result).toBe('Hi there (Subscriber)');
  });
});
