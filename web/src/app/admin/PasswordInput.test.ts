import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PasswordInput from './PasswordInput';

describe('password visibility control', () => {
  it('starts masked and keeps the toggle separate from form submission', () => {
    const html = renderToStaticMarkup(createElement(PasswordInput, {
      id: 'login-password', name: 'password', autoComplete: 'current-password'
    }));
    expect(html).toContain('type="password"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-controls="login-password"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="הצגת הסיסמה"');
  });

  it('preserves password validation and distinguishes confirmation controls', () => {
    const html = renderToStaticMarkup(createElement(PasswordInput, {
      id: 'confirm-password', name: 'confirmation', autoComplete: 'new-password',
      minLength: 12, label: 'אימות הסיסמה'
    }));
    expect(html).toContain('name="confirmation"');
    expect(html).toContain('minLength="12"');
    expect(html).toContain('required=""');
    expect(html).toContain('aria-label="הצגת אימות הסיסמה"');
  });
});
