// src/config/firebase.ts
// Lazy initialization to prevent crashing when env vars are missing at module load time

import { initializeApp, FirebaseApp, getApps } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _storage: FirebaseStorage | null = null

function getFirebaseApp(): FirebaseApp {
    if (_app) return _app

    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'multiversechat-632a8'
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`

    if (!apiKey) {
        throw new Error(
            'Firebase API key is missing. Please add VITE_FIREBASE_API_KEY to your frontend/.env file.\n' +
            'Get it from: https://console.firebase.google.com → Project Settings → Your apps → Web app'
        )
    }

    const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    }

    // Reuse if already initialized (HMR safe)
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    return _app
}

export function getFirebaseAuth(): Auth {
    if (!_auth) {
        _auth = getAuth(getFirebaseApp())
    }
    return _auth
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!_storage) {
        _storage = getStorage(getFirebaseApp())
    }
    return _storage
}

// Named export for backward compatibility (will throw if apiKey missing — caught in LoginPage)
export { getFirebaseAuth as auth }
