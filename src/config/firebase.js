import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAyGMxyO553tLm8tVkH83MuT0_IXdtYIwc",
  authDomain: "sistech-pos.firebaseapp.com",
  projectId: "sistech-pos",
  storageBucket: "sistech-pos.firebasestorage.app",
  messagingSenderId: "942597786915",
  appId: "1:942597786915:web:64c6a6d786a82b329ad096",
  measurementId: "G-8C9D7P6GP6"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent offline caching (IndexedDB)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Authentication
const auth = getAuth(app);

export { db, auth };
