<template>
	<v-list>
		<v-list-item
			v-if="setting"
			:prepend-avatar="setting.profileUrl"
			:title="setting.title"
			:subtitle="setting.description" />
		<v-divider></v-divider>
		<v-list-item :prepend-icon="mdiInformationOutline" title="お知らせ" value="news" />
		<v-list-item :prepend-icon="mdiCog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import { useRouter } from 'vue-router';
import {
	mdiInformationOutline,
	mdiCog
} from '@mdi/js';

const router = useRouter();

const props = defineProps({
	setting: {
		type: Object,
		required: true,
	}
})
const setting = ref(props.setting); 

// ブログ設定へ
const goToProfile = () => {
	router.push('/admin/3');
}
</script>
