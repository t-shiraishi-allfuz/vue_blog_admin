import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from "firebase/analytics"

// 環境変数のバリデーション
const requiredEnvVars = {
	VITE_APP_API_KEY: import.meta.env.VITE_APP_API_KEY,
	VITE_APP_AUTH_DOMAIN: import.meta.env.VITE_APP_AUTH_DOMAIN,
	VITE_APP_PROJECT_ID: import.meta.env.VITE_APP_PROJECT_ID,
	VITE_APP_STORAGE_BUCKET: import.meta.env.VITE_APP_STORAGE_BUCKET,
	VITE_APP_MESSAGING_SENDER_ID: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
	VITE_APP_ID: import.meta.env.VITE_APP_ID,
}

// 必須環境変数のチェック
const missingVars = Object.entries(requiredEnvVars)
	.filter(([_, value]) => !value)
	.map(([key]) => key)

if (missingVars.length > 0) {
	const errorMessage = `Firebase設定エラー: 以下の環境変数が設定されていません:\n${missingVars.join('\n')}\n\nproduction環境では、.env.productionファイルまたは環境変数として設定してください。`
	console.error(errorMessage)
	throw new Error(errorMessage)
}

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
