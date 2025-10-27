import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'

export const useAccessLogStore = defineStore('accessLog', () => {
	// アクセスログを記録（詳細な分析用）
	const create = async (blogId: string) => {
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
			throw new Error(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	// つぶやきのアクセスログを記録
	const createTweetAccessLog = async (tweetId: string) => {
		try {
			const accessLog = {
				tweetId: tweetId,
				accessedAt: new Date(),
				userAgent: navigator.userAgent,
				referrer: document.referrer || null,
			}

			await BaseAPI.addData(
				{ db_name: "tweet_access_log" },
				accessLog
			)
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	// つぶやきの統計情報を取得
	const getTweetStats = async () => {
		try {
			// 全つぶやきを取得
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "tweet",
				searchConditions: {
					filters: [["isPublished", "==", true]],
					sorters: [["createdAt", "desc"]]
				}
			})

			if (!querySnapshot) {
				return {
					totalTweetCount: 0,
					totalTweetAccessCount: 0,
					averageTweetAccessCount: 0,
					popularTweets: [],
					recentTweets: [],
					accessDistribution: {
						zero: 0,
						low: 0,
						medium: 0,
						high: 0,
						veryHigh: 0
					}
				}
			}

			const tweets = querySnapshot.docs.map(doc => {
				const data = doc.data()
				let createdAt = data.createdAt
				
				// FirestoreのTimestampをDateオブジェクトに変換
				if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
					createdAt = (createdAt as any).toDate()
				} else if (createdAt && !(createdAt instanceof Date)) {
					// 文字列や数値の場合はDateオブジェクトに変換
					createdAt = new Date(createdAt)
				}
				
				return {
					id: doc.id,
					content: data.content as string,
					viewCount: (data.viewCount as number) || 0,
					createdAt: createdAt as Date,
					isPublished: data.isPublished as boolean
				}
			})

			// 総つぶやき数
			const totalTweetCount = tweets.length

			// 総アクセス数
			const totalTweetAccessCount = tweets.reduce((sum, tweet) => sum + tweet.viewCount, 0)

			// 平均アクセス数
			const averageTweetAccessCount = totalTweetCount > 0 ? totalTweetAccessCount / totalTweetCount : 0

			// 人気つぶやきランキング（アクセス数順）
			const popularTweets = [...tweets]
				.sort((a, b) => b.viewCount - a.viewCount)
				.slice(0, 10)

			// 最近のつぶやき（作成日時順）
			const recentTweets = [...tweets]
				.sort((a, b) => {
					try {
						const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt ? new Date(a.createdAt) : new Date(0))
						const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt ? new Date(b.createdAt) : new Date(0))
						
						// 無効な日付の場合は0を返す
						if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
							return 0
						}
						
						return dateB.getTime() - dateA.getTime()
					} catch (error) {
						console.error('日付ソートエラー:', error)
						return 0
					}
				})
				.slice(0, 20)

			// アクセス数分布
			const accessDistribution = {
				zero: 0,
				low: 0,
				medium: 0,
				high: 0,
				veryHigh: 0
			}

			tweets.forEach(tweet => {
				const count = tweet.viewCount
				if (count === 0) {
					accessDistribution.zero++
				} else if (count <= 10) {
					accessDistribution.low++
				} else if (count <= 50) {
					accessDistribution.medium++
				} else if (count <= 100) {
					accessDistribution.high++
				} else {
					accessDistribution.veryHigh++
				}
			})

			return {
				totalTweetCount,
				totalTweetAccessCount,
				averageTweetAccessCount,
				popularTweets,
				recentTweets,
				accessDistribution
			}
		} catch (error) {
			throw new Error(`つぶやき統計の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	// モーメントの統計情報を取得
	const getMomentStats = async () => {
		try {
			// 全モーメントを取得
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "moment",
				searchConditions: {
					filters: [["isPublished", "==", true]],
					sorters: [["createdAt", "desc"]]
				}
			})

			if (!querySnapshot) {
				return {
					totalMomentCount: 0,
					totalMomentAccessCount: 0,
					averageMomentAccessCount: 0,
					popularMoments: [],
					recentMoments: [],
					accessDistribution: {
						zero: 0,
						low: 0,
						medium: 0,
						high: 0,
						veryHigh: 0
					}
				}
			}

			const moments = querySnapshot.docs.map(doc => {
				const data = doc.data()
				let createdAt = data.createdAt
				
				// FirestoreのTimestampをDateオブジェクトに変換
				if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
					createdAt = (createdAt as any).toDate()
				} else if (createdAt && !(createdAt instanceof Date)) {
					// 文字列や数値の場合はDateオブジェクトに変換
					createdAt = new Date(createdAt)
				}
				
				return {
					id: doc.id,
					title: data.title as string,
					viewCount: (data.viewCount as number) || 0,
					createdAt: createdAt as Date,
					isPublished: data.isPublished as boolean
				}
			})

			// 総モーメント数
			const totalMomentCount = moments.length

			// 総アクセス数
			const totalMomentAccessCount = moments.reduce((sum, moment) => sum + moment.viewCount, 0)

			// 平均アクセス数
			const averageMomentAccessCount = totalMomentCount > 0 ? totalMomentAccessCount / totalMomentCount : 0

			// 人気モーメントランキング（アクセス数順）
			const popularMoments = [...moments]
				.sort((a, b) => b.viewCount - a.viewCount)
				.slice(0, 10)

			// 最近のモーメント（作成日時順）
			const recentMoments = [...moments]
				.sort((a, b) => {
					try {
						const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt ? new Date(a.createdAt) : new Date(0))
						const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt ? new Date(b.createdAt) : new Date(0))
						
						// 無効な日付の場合は0を返す
						if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
							return 0
						}
						
						return dateB.getTime() - dateA.getTime()
					} catch (error) {
						console.error('日付ソートエラー:', error)
						return 0
					}
				})
				.slice(0, 20)

			// アクセス数分布
			const accessDistribution = {
				zero: 0,
				low: 0,
				medium: 0,
				high: 0,
				veryHigh: 0
			}

			moments.forEach(moment => {
				const count = moment.viewCount
				if (count === 0) {
					accessDistribution.zero++
				} else if (count <= 10) {
					accessDistribution.low++
				} else if (count <= 50) {
					accessDistribution.medium++
				} else if (count <= 100) {
					accessDistribution.high++
				} else {
					accessDistribution.veryHigh++
				}
			})

			return {
				totalMomentCount,
				totalMomentAccessCount,
				averageMomentAccessCount,
				popularMoments,
				recentMoments,
				accessDistribution
			}
		} catch (error) {
			throw new Error(`モーメント統計の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	return {
		create,
		createTweetAccessLog,
		getTweetStats,
		getMomentStats
	}
})
