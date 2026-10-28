import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  remove
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

interface FirebaseClientOptions {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

const readFirebaseEnv = (value: string | undefined): string => value?.trim() || '';

const firebaseConfig: FirebaseClientOptions = {
  apiKey: readFirebaseEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: readFirebaseEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: readFirebaseEnv(import.meta.env.VITE_FIREBASE_DATABASE_URL),
  projectId: readFirebaseEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: readFirebaseEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || undefined,
  messagingSenderId: readFirebaseEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || undefined,
  appId: readFirebaseEnv(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: readFirebaseEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || undefined
};

const requiredFirebaseConfig: {
  key: keyof FirebaseClientOptions;
  envName: string;
}[] = [
  { key: 'apiKey', envName: 'VITE_FIREBASE_API_KEY' },
  { key: 'authDomain', envName: 'VITE_FIREBASE_AUTH_DOMAIN' },
  { key: 'databaseURL', envName: 'VITE_FIREBASE_DATABASE_URL' },
  { key: 'projectId', envName: 'VITE_FIREBASE_PROJECT_ID' },
  { key: 'appId', envName: 'VITE_FIREBASE_APP_ID' }
];
const missingFirebaseConfig = requiredFirebaseConfig
  .filter(({ key }) => {
    const value = firebaseConfig[key];
    return !value || /^(your_|placeholder|example)/i.test(value);
  })
  .map(({ envName }) => envName);

const firebaseClient = (() => {
  if (missingFirebaseConfig.length > 0) {
    return {
      app: null,
      db: null,
      error: `Firebase belum dikonfigurasi. Variabel yang diperlukan: ${missingFirebaseConfig.join(', ')}.`
    };
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return { app, db: getDatabase(app), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Firebase initialization failed:', error);
    return { app: null, db: null, error: `Firebase gagal diinisialisasi: ${message}` };
  }
})();

export const app = firebaseClient.app;
export const db = firebaseClient.db;
export const firebaseConfigError = firebaseClient.error;

export { ref, set, get, onValue, update, remove };

export interface TeacherRecord {
  id: string;
  nama: string;
  tingkatKelas: string; // '1' | '2' | '3' | '4' | '5' | '6'
  namaKelas: string; // e.g. 'Kelas 4' or '4A'
  username: string;
  password: string;
  niy?: string;
}

export interface AppSettings {
  activeTriwulan: 'T1' | 'T2' | 'T3' | 'T4';
  tempatRaport: string;
  tanggalRaport: string;
  kepalaSekolahNama: string;
  kepalaSekolahNiy: string;
  guruKelasNama: string;
  guruKelasNiy: string;
}
