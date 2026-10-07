import { describe, expect, it, vi } from 'vitest';
import { handleRecoveryFragment } from './recovery';

describe('password recovery landing', () => {
  it('ignores ordinary anchors and other auth flows', async () => {
    for (const hash of ['#main', '#type=email&access_token=a&refresh_token=b']) {
      const clear = vi.fn(), establish = vi.fn(), navigate = vi.fn();
      await handleRecoveryFragment(hash, clear, establish, navigate);
      expect(clear).not.toHaveBeenCalled();
      expect(establish).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    }
  });

  it('clears tokens before establishing cookies, then opens the guarded password form', async () => {
    const clear = vi.fn(), navigate = vi.fn();
    const establish = vi.fn(async () => {
      expect(clear).toHaveBeenCalledOnce();
      return { error: null };
    });
    await handleRecoveryFragment('#type=recovery&access_token=a&refresh_token=b&next=https://evil.example', clear, establish, navigate);
    expect(establish).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'b' });
    expect(navigate).toHaveBeenCalledWith('/admin/password');
  });

  it('rejects incomplete sessions without contacting auth', async () => {
    const clear = vi.fn(), establish = vi.fn(), navigate = vi.fn();
    await handleRecoveryFragment('#type=recovery&access_token=a', clear, establish, navigate);
    expect(clear).toHaveBeenCalledOnce();
    expect(establish).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/admin/login?error=auth-callback');
  });

  it.each(['returned', 'thrown'])('handles %s auth errors without leaking tokens', async (mode) => {
    const navigate = vi.fn();
    await handleRecoveryFragment('#type=recovery&access_token=secret&refresh_token=secret', vi.fn(), async () => {
      if (mode === 'thrown') throw new Error('network');
      return { error: new Error('expired') };
    }, navigate);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/admin/login?error=auth-callback');
  });
});
