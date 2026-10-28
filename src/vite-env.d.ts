/// <reference types="vite/client" />

declare module 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js' {
  interface FirebaseApp {}

  export function initializeApp(options: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
    measurementId?: string;
  }): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(): FirebaseApp;
}

declare module 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js' {
  interface FirebaseApp {}
  interface Database {}
  interface DatabaseReference {}
  interface DataSnapshot {
    exists(): boolean;
    val(): any;
  }

  export function getDatabase(app?: FirebaseApp): Database;
  export function ref(database: Database, path?: string): DatabaseReference;
  export function set(reference: DatabaseReference, value: unknown): Promise<void>;
  export function get(reference: DatabaseReference): Promise<DataSnapshot>;
  export function onValue(
    reference: DatabaseReference,
    callback: (snapshot: DataSnapshot) => void,
    cancelCallback?: (error: Error) => void
  ): () => void;
  export function update(reference: DatabaseReference, values: object): Promise<void>;
  export function remove(reference: DatabaseReference): Promise<void>;
}
