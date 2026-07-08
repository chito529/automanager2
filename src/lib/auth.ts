export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}

type AuthStateCallback = (user: AuthUser | null) => void;
const listeners = new Set<AuthStateCallback>();

const defaultUser: AuthUser = {
  uid: 'uid_public_default',
  email: 'public@automanager.com',
  displayName: 'Público',
};

let currentUser: AuthUser | null = defaultUser;

export const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(callback: AuthStateCallback) {
    listeners.add(callback);
    // Initial sync callback with the default user
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
    listeners.forEach(cb => cb(user));
  },
  signOut() {
    // Keep it on public mode
    currentUser = defaultUser;
    listeners.forEach(cb => cb(defaultUser));
  }
};

