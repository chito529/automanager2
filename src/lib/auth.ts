export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}

type AuthStateCallback = (user: AuthUser | null) => void;
const listeners = new Set<AuthStateCallback>();

let currentUser: AuthUser | null = (() => {
  try {
    const saved = localStorage.getItem('automanager_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

export const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(callback: AuthStateCallback) {
    listeners.add(callback);
    // Initial sync callback
    callback(currentUser);
    return () => {
      listeners.delete(callback);
    };
  },
  signIn(email: string, displayName: string) {
    const cleanEmail = email.trim().toLowerCase();
    const uid = 'uid_' + btoa(cleanEmail).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const user: AuthUser = {
      uid,
      email: cleanEmail,
      displayName: displayName || email.split('@')[0],
    };
    currentUser = user;
    localStorage.setItem('automanager_session', JSON.stringify(user));
    listeners.forEach(cb => cb(user));
  },
  signOut() {
    currentUser = null;
    localStorage.removeItem('automanager_session');
    listeners.forEach(cb => cb(null));
  }
};
