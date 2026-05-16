// Firebase Admin SDK initialization
// Exports: db (Firestore), auth (Firebase Auth)

import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        })
        console.log('🔥 Firebase conectado correctamente')
    } catch (error) {
        console.error('❌ Error al conectar a Firebase:', error)
    }
}

export const db = admin.firestore()
export const auth = admin.auth()

export default admin
