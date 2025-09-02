// Client-side biometric / credential helper (Option A - convenience only)
// Uses the Credential Management API (PasswordCredential) where available.
// Relies on the browser / OS password manager which commonly prompts
// for platform biometrics on mobile (Android fingerprint, iOS Face ID via keychain).

type PasswordCredLike = { id?: string; name?: string; password?: string };

type PasswordCredConstructor = new (data: { id?: string; password?: string; name?: string }) => PasswordCredLike;

type CredsContainerLike = {
  store?: (cred: PasswordCredLike) => Promise<void>;
  get?: (opts?: unknown) => Promise<PasswordCredLike | null>;
  preventSilentAccess?: () => Promise<void>;
};

function getCredentialEnvironment() {
  const win = window as Window & {
    PasswordCredential?: PasswordCredConstructor;
    webkitPasswordCredential?: PasswordCredConstructor;
  };
  const nav = navigator as Navigator & { credentials?: CredsContainerLike };
  return { win, nav };
}

export function isCredentialAPISupported(): boolean {
  try {
    const { win, nav } = getCredentialEnvironment();
    const supports = typeof nav !== 'undefined' && !!nav.credentials;
    const hasCtor = typeof win.PasswordCredential !== 'undefined' || typeof win.webkitPasswordCredential !== 'undefined';
    return !!supports && !!hasCtor;
  } catch {
    return false;
  }
}

// Store email/password in the browser credential manager. Best-effort.
export async function registerDeviceCredential(email: string, password: string): Promise<boolean> {
  if (!isCredentialAPISupported()) return false;
  try {
    const { win, nav } = getCredentialEnvironment();
    const CredCtor = win.PasswordCredential || win.webkitPasswordCredential;
    if (CredCtor && nav.credentials && nav.credentials.store) {
      const cred = new CredCtor({ id: email, password, name: email }) as PasswordCredLike;
      await nav.credentials.store(cred);
      return true;
    }

    // Fallback minimal form technique to hint password managers (rarely used)
    const form = document.createElement('form');
    form.style.display = 'none';
    form.action = location.href;
    form.method = 'POST';
    const iEmail = document.createElement('input');
    iEmail.name = 'username';
    iEmail.value = email;
    const iPass = document.createElement('input');
    iPass.name = 'password';
    iPass.value = password;
    form.appendChild(iEmail);
    form.appendChild(iPass);
    document.body.appendChild(form);
    try {
      // nothing to do; some UIs may pick this up
      return false;
    } finally {
      form.remove();
    }
  } catch (err) {
    // log only
    // eslint-disable-next-line no-console
    console.error('registerDeviceCredential error', err);
    return false;
  }
}

// Retrieve stored credential (if the user consents / unlocks using platform biometrics).
export async function getStoredDeviceCredential(): Promise<{ id: string; password: string } | null> {
  if (!isCredentialAPISupported()) return null;
  try {
    const { nav } = getCredentialEnvironment();
    if (!nav.credentials || !nav.credentials.get) return null;

    // Try to force user-mediated prompt with 'required' mediation first.
    // Some browsers ignore 'optional' unless user interaction is explicit.
    // We'll attempt 'required' then fall back to 'optional'.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container = nav.credentials as any;
    let cred: PasswordCredLike | null = null;

    try {
      console.debug('[biometric] attempting credentials.get with mediation=required');
      cred = await container.get({ password: true, mediation: 'required' });
      console.debug('[biometric] result (required):', cred);
    } catch (e) {
      console.debug('[biometric] mediation=required failed or not supported, trying optional', e);
    }

    if (!cred) {
      try {
        console.debug('[biometric] attempting credentials.get with mediation=optional');
        cred = await container.get({ password: true, mediation: 'optional' });
        console.debug('[biometric] result (optional):', cred);
      } catch (e) {
        console.debug('[biometric] mediation=optional failed', e);
      }
    }

    if (!cred) return null;
    return { id: (cred.id || cred.name) ?? '', password: cred.password ?? '' };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getStoredDeviceCredential error', err);
    return null;
  }
}

// Best-effort: ask browser to prevent silent access (not strictly needed here)
export async function preventSilentAccess(): Promise<void> {
  try {
    const { nav } = getCredentialEnvironment();
    if (nav.credentials && nav.credentials.preventSilentAccess) {
      await nav.credentials.preventSilentAccess();
    }
  } catch {
    // ignore
  }
}
