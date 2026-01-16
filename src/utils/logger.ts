/**
 * ログユーティリティ
 * アクセスログ、課金ログ、エラーログをファイルに保存する
 */

// ログタイプ
export type LogType = 'access' | 'purchase' | 'error'

// ログデータ型
export interface AccessLogData {
	blogId?: string
	tweetId?: string
	accessedAt: Date
	userAgent: string
	referrer: string | null
	[key: string]: any
}

export interface PurchaseLogData {
	userId: string
	amount: number
	operation: 'add' | 'consume'
	timestamp: Date
	remainingCoins: number
	[key: string]: any
}

export interface ErrorLogData {
	message: string
	stack?: string
	context?: string | null
	timestamp: Date
	[key: string]: any
}

/**
 * 日付からファイルパスとファイル名を生成
 */
const getLogFilePath = (type: LogType): { year: string; month: string; day: string; filename: string } => {
	const now = new Date()
	const year = now.getFullYear().toString()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	
	let filename = ''
	switch (type) {
		case 'access':
			filename = `${day}_accsess_log`
			break
		case 'purchase':
			filename = `${day}_purchase_log`
			break
		case 'error':
			filename = `${day}_error_log`
			break
	}
	
	return { year, month, day, filename }
}

/**
 * ログデータをJSON形式の文字列に変換
 */
const formatLogEntry = (data: AccessLogData | PurchaseLogData | ErrorLogData, type: LogType): string => {
	const timestamp = new Date().toISOString()
	
	// dataがnullまたはundefinedの場合は空オブジェクトを使用
	if (!data || typeof data !== 'object') {
		return JSON.stringify({ timestamp, error: 'Invalid log data' }) + '\n'
	}
	
	switch (type) {
		case 'access':
			const accessData = data as AccessLogData
			const accessEntries = accessData && typeof accessData === 'object' 
				? Object.entries(accessData).filter(([key]) => 
					!['blogId', 'tweetId', 'accessedAt', 'userAgent', 'referrer'].includes(key)
				)
				: []
			return JSON.stringify({
				timestamp,
				blogId: accessData?.blogId || null,
				tweetId: accessData?.tweetId || null,
				accessedAt: accessData?.accessedAt ? new Date(accessData.accessedAt).toISOString() : null,
				userAgent: accessData?.userAgent || '',
				referrer: accessData?.referrer || null,
				...Object.fromEntries(accessEntries)
			}) + '\n'
		
		case 'purchase':
			const purchaseData = data as PurchaseLogData
			const purchaseEntries = purchaseData && typeof purchaseData === 'object'
				? Object.entries(purchaseData).filter(([key]) => 
					!['userId', 'amount', 'operation', 'remainingCoins', 'timestamp'].includes(key)
				)
				: []
			return JSON.stringify({
				timestamp,
				userId: purchaseData?.userId || '',
				amount: purchaseData?.amount || 0,
				operation: purchaseData?.operation || 'unknown',
				remainingCoins: purchaseData?.remainingCoins || 0,
				...Object.fromEntries(purchaseEntries)
			}) + '\n'
		
		case 'error':
			const errorData = data as ErrorLogData
			const errorEntries = errorData && typeof errorData === 'object'
				? Object.entries(errorData).filter(([key]) => 
					!['message', 'stack', 'context', 'timestamp'].includes(key)
				)
				: []
			return JSON.stringify({
				timestamp,
				message: errorData?.message || 'Unknown error',
				stack: errorData?.stack || null,
				context: errorData?.context || null,
				...Object.fromEntries(errorEntries)
			}) + '\n'
	}
}

/**
 * ログをファイルに保存（API経由）
 */
const saveLogToFile = async (
	type: LogType,
	data: AccessLogData | PurchaseLogData | ErrorLogData
): Promise<void> => {
	try {
		const { year, month, filename } = getLogFilePath(type)
		const logEntry = formatLogEntry(data, type)
		
		// バックエンドAPIエンドポイントを呼び出し
		const response = await fetch('/api/logs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				type,
				year,
				month,
				filename,
				logEntry
			})
		})
		
		if (!response.ok) {
			throw new Error(`ログ保存エラー: ${response.statusText}`)
		}
	} catch (error) {
		// ログ保存に失敗してもエラーを投げない（アプリケーションの動作を止めない）
		console.error('ログ保存エラー:', error)
	}
}

/**
 * アクセスログを保存
 */
export const logAccess = async (data: AccessLogData): Promise<void> => {
	await saveLogToFile('access', data)
}

/**
 * 課金ログを保存
 */
export const logPurchase = async (data: PurchaseLogData): Promise<void> => {
	await saveLogToFile('purchase', data)
}

/**
 * エラーログを保存
 */
export const logError = async (error: Error, context?: string): Promise<void> => {
	const errorData: ErrorLogData = {
		message: error.message,
		stack: error.stack,
		context: context || null,
		timestamp: new Date()
	}
	await saveLogToFile('error', errorData)
}
