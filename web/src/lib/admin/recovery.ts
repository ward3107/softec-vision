type RecoverySession = { access_token: string; refresh_token: string };

export async function handleRecoveryFragment(
  hash: string,
  clearFragment: () => void,
  establishSession: (session: RecoverySession) => Promise<{ error: unknown }>,
  navigate: (path: string) => void
) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('type') !== 'recovery') return;

  // Tokens belong only in the auth client, never in navigation or analytics URLs.
  clearFragment();
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  try {
    if (!access_token || !refresh_token) throw new Error('Missing recovery session');
    const { error } = await establishSession({ access_token, refresh_token });
    if (error) throw error;
  } catch {
    navigate('/admin/login?error=auth-callback');
    return;
  }
  navigate('/admin/password');
}
