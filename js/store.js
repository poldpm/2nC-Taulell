// Capa d'emmagatzematge: Firebase (núvol, sincronitzat entre ordinadors) o localStorage (mode prova).
import { firebaseConfig, TAULELL_ID } from './config.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const LOCAL_KEY = `taulell:${TAULELL_ID}`;

export const isCloud = Boolean(firebaseConfig && firebaseConfig.apiKey);

export function createStore() {
  return isCloud ? cloudStore() : Promise.resolve(localStore());
}

function localStore() {
  const read = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  return {
    mode: 'local',
    onAuth(cb) {
      cb({ name: 'Mode prova' });
      return () => {};
    },
    signIn: async () => {},
    signOut: async () => {},
    subscribe(cb) {
      cb(read());
      const onStorage = (e) => { if (e.key === LOCAL_KEY) cb(read()); };
      addEventListener('storage', onStorage);
      return () => removeEventListener('storage', onStorage);
    },
    async save(state) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    },
  };
}

async function cloudStore() {
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(FB + 'firebase-app.js'),
    import(FB + 'firebase-firestore.js'),
    import(FB + 'firebase-auth.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  let db;
  try {
    // Memòria cau persistent: si cau la connexió, el taulell continua mostrant l'últim estat.
    db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch {
    db = fs.getFirestore(app);
  }
  const auth = au.getAuth(app);
  const ref = fs.doc(db, 'taulells', TAULELL_ID);

  return {
    mode: 'cloud',
    onAuth(cb) {
      return au.onAuthStateChanged(auth, (u) => cb(u ? { name: u.displayName || u.email, email: u.email } : null));
    },
    signIn: () => au.signInWithPopup(auth, new au.GoogleAuthProvider()),
    signOut: () => au.signOut(auth),
    subscribe(cb, onError) {
      return fs.onSnapshot(
        ref,
        (snap) => cb(snap.exists() ? JSON.parse(snap.data().json) : null),
        onError,
      );
    },
    async save(state) {
      await fs.setDoc(ref, { json: JSON.stringify(state), updatedAt: fs.serverTimestamp() });
    },
  };
}
