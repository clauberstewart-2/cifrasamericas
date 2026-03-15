import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAe_hElPlqUbKxS9MFroN1A9UbmrImoWQY",
  authDomain: "cifrasamericas-app.firebaseapp.com",
  projectId: "cifrasamericas-app",
  storageBucket: "cifrasamericas-app.firebasestorage.app",
  messagingSenderId: "747085578959",
  appId: "1:747085578959:web:c502106f2b47bdb5ea6dba"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
