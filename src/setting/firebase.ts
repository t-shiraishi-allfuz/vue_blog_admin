import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
	apiKey: import.meta.env.VITE_APP_API_KEY,
	authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_APP_PROJECT_ID,
	storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_APP_ID,
	measurementId: import.meta.env.VITE_APP_GID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

// Google認証プロバイダー
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({
	prompt: 'select_account'
})
