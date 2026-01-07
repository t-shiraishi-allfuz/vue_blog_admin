<template>
	<MomentForm 
		:is-edit="false"
		@saved="handleSaved"
		@error="handleError"
	/>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// 保存成功時の処理
const handleSaved = () => {
	const from = route.query.from
	if (from === 'admin') {
		router.push({ path: '/admin', query: {tab: 1} })
	} else {
		router.push({ path: '/' })
	}
}

// エラー時の処理
const handleError = (error: any) => {
	console.error('モーメント作成エラー:', error)
}
</script>

