import { db } from '@/setting/firebase'
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	getDoc,
	getDocs,
	addDoc,
	setDoc,
	deleteDoc,
	doc
} from 'firebase/firestore'

class BaseAPI {
	static getCollection(dbName) {
		return collection(db, dbName)
	}

	static getDoc(dbName) {
		return doc(db, dbName)
	}

	static getDocRef(dbName, itemId) {
		return doc(db, dbName, itemId)
	}

	static async getData(param) {
		try {
			const docRefs = this.getDocRef(param.db_name, param.item_id)
			const snapshot = await getDoc(docRefs)
			if (snapshot.exists()) {
				return snapshot
			}
			return null
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	static async getDataWithQuery(param) {
		const paramConstraints = []

		let filters = param.searchConditions.filters ?? []
		let sorters = param.searchConditions.sorters ?? []
		let docLimit = param.searchConditions.limit ?? 100

		if (filters && filters.length > 0) {
			filters.forEach((filter) => {
				paramConstraints.push(where(...filter))
			})
		}
		if (sorters && sorters.length > 0) {
			sorters.forEach((sorter) => {
				paramConstraints.push(orderBy(...sorter))
			})
		}
		paramConstraints.push(limit(docLimit))

		try {
			const collectionRefs = this.getCollection(param.db_name)
			const searchQuery = query(collectionRefs, ...paramConstraints)
			const result = await getDocs(searchQuery)
			return result
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	static async addData (param, payload) {
		try {
			const collectionRefs = this.getCollection(param.db_name)
			await addDoc(collectionRefs, payload)
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	static async addDataToSubCollection (param, payload) {
		try {
			const collectionRefs = collection(db, ...param.path)
			await addDoc(collectionRefs, payload)
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	static async setData (param, payload) {
		try {
			const docRefs = this.getDocRef(param.db_name, param.item_id)
			await setDoc(docRefs, payload, { merge: true })
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	static async deleteData (param) {
		try {
			const docRefs = this.getDocRef(param.db_name, param.item_id)
			await deleteDoc(docRefs)
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}
}
export default BaseAPI
