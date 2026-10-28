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

const firebaseConfig: FirebaseClientOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined
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
  .filter(({ key }) => !firebaseConfig[key])
  .map(({ envName }) => envName);

if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Firebase configuration is missing: ${missingFirebaseConfig.join(', ')}. ` +
    'Copy .env.example to .env.local and provide the Firebase web app settings.'
  );
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

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
