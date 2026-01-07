<template>
	<v-dialog 
		v-model="dialog" 
		max-width="500px" 
		:persistent="persistent"
		:scrollable="scrollable"
	>
		<v-card>
			<slot name="title">
				<v-card-title class="d-flex justify-content-center pa-4">
					<h4 class="text-h5">{{ props.label || "確認" }}</h4>
				</v-card-title>
			</slot>
			<slot name="contents"></slot>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
interface Props {
	label: string
	persistent?: boolean
	scrollable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	persistent: false,
	scrollable: false
})
const dialog = defineModel<boolean>('dialog')

const closeDialog = (): void => {
	dialog.value = false
}

// 親コンポーネントから呼び出せるように公開
defineExpose({
	closeDialog
})
</script>

<style scoped>
:deep(.v-card) {
	border-radius: 12px;
}

:deep(.v-card-title) {
	background-color: rgb(var(--v-theme-primary));
	color: white;
}

:deep(.v-card-title h4) {
	margin: 0;
	font-weight: 500;
}
</style>
