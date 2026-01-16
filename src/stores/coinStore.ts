import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { logPurchase, type PurchaseLogData } from '@/utils/logger'

// 型定義
interface CoinData {
	coins: number
	updatedAt: Date | null
	createdAt: Date | null
}

export const useCoinStore = defineStore('coin', () => {
	const coins = ref<number>(0)
	const authStore = useAuthStore()
	const MAX_COINS = 999999
	const DEFAULT_COINS = 0

	// コイン情報を取得
	const getCoins = async (): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			coins.value = DEFAULT_COINS
			return
		}

		try {
			const doc = await BaseAPI.getData({
				db_name: 'user_coins',
				item_id: userInfo.uid
			})
			
			if (doc && doc.exists()) {
				const data = doc.data() as CoinData
				coins.value = data.coins || DEFAULT_COINS
			} else {
				// ドキュメントが存在しない場合はデフォルト値を使用
				coins.value = DEFAULT_COINS
			}
		} catch (error) {
			console.error('コイン情報の取得エラー:', error)
			coins.value = DEFAULT_COINS
		}
	}

	// コインを追加（チャージ）
	const addCoins = async (amount: number): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (amount <= 0) {
			throw new Error('追加するコイン数は1以上である必要があります')
		}

		try {
			const currentCoins = coins.value || DEFAULT_COINS
			const newCoins = Math.min(currentCoins + amount, MAX_COINS)
			
			const now = new Date()
			// 既存のコインデータからcreatedAtを取得、なければnowを使用
			const existingData = await BaseAPI.getData({
				db_name: 'user_coins',
				item_id: userInfo.uid
			})
			const existingCreatedAt: Date | null = existingData?.exists() ? ((existingData.data() as CoinData).createdAt || null) : null
			
			const coinData: CoinData = {
				coins: newCoins,
				updatedAt: now,
				createdAt: existingCreatedAt || now
			}

			await BaseAPI.setData(
				{ db_name: 'user_coins', item_id: userInfo.uid },
				coinData
			)

			coins.value = newCoins

			// ファイルログにも保存
			try {
				const logData: PurchaseLogData = {
					userId: userInfo.uid,
					amount: amount,
					operation: 'add',
					timestamp: now,
					remainingCoins: newCoins
				}
				await logPurchase(logData)
			} catch (logError) {
				// ログ保存エラーは無視
				console.error('課金ログ保存エラー:', logError)
			}
		} catch (error: any) {
			console.error('コイン追加エラー:', error)
			throw new Error(`コインの追加に失敗しました: ${error.message}`)
		}
	}

	// コインを消費
	const consumeCoins = async (amount: number): Promise<boolean> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (amount <= 0) {
			throw new Error('消費するコイン数は1以上である必要があります')
		}

		try {
			const currentCoins = coins.value || DEFAULT_COINS
			
			if (currentCoins < amount) {
				return false // コインが不足
			}

			const newCoins = currentCoins - amount
			const now = new Date()
			// 既存のコインデータからcreatedAtを取得、なければnowを使用
			const existingData = await BaseAPI.getData({
				db_name: 'user_coins',
				item_id: userInfo.uid
			})
			const existingCreatedAt: Date | null = existingData?.exists() ? ((existingData.data() as CoinData).createdAt || null) : null
			
			const coinData: CoinData = {
				coins: newCoins,
				updatedAt: now,
				createdAt: existingCreatedAt || now
			}

			await BaseAPI.setData(
				{ db_name: 'user_coins', item_id: userInfo.uid },
				coinData
			)

			coins.value = newCoins

			// ファイルログにも保存
			const logData: PurchaseLogData = {
				userId: userInfo.uid,
				amount: amount,
				operation: 'consume',
				timestamp: now,
				remainingCoins: newCoins
			}
			await logPurchase(logData)

			return true
		} catch (error: any) {
			console.error('コイン消費エラー:', error)
			throw new Error(`コインの消費に失敗しました: ${error.message}`)
		}
	}

	// コインが十分にあるかチェック
	const hasEnoughCoins = (amount: number): boolean => {
		return (coins.value || DEFAULT_COINS) >= amount
	}

	// ストアをクリア
	const clearStore = (): void => {
		coins.value = DEFAULT_COINS
	}

	return {
		coins,
		MAX_COINS,
		DEFAULT_COINS,
		getCoins,
		addCoins,
		consumeCoins,
		hasEnoughCoins,
		clearStore
	}
})

