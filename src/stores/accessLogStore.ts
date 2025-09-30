import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'

export const useAccessLogStore = defineStore('accessLog', () => {
	// アクセスログを記録（詳細な分析用）
	const create = async (blogId) => {
		try {
			const accessLog = {
				blogId: blogId,
				accessedAt: new Date(),
				userAgent: navigator.userAgent,
				referrer: document.referrer || null,
			}

			await BaseAPI.addData(
				{ db_name: "blog_access_log" },
				accessLog
			)
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	return {
		create
	}
})
