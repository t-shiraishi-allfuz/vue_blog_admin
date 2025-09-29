<template>
	<v-list>
		<v-list-item
			v-if="setting"
			:prepend-avatar="setting.profileUrl"
			:title="setting.title"
			:subtitle="setting.description" />
		<v-divider></v-divider>
		<v-list-item prepend-icon="mdi-cog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
	setting: {
		type: Object,
		required: true,
	}
})
const setting = ref(props.setting)

const goToProfile = () => {
	router.push({path: '/admin'})
}

</script>
