<template>
	<v-navigation-drawer v-model="drawer" temporary>
		<v-list>
			<v-list-item
				:prepend-avatar="blogSettingStore.blogSetting.profileUrl"
				:title="blogSettingStore.blogSetting.title"
				:subtitle="blogSettingStore.blogSetting.description">
			</v-list-item>
		</v-list>
		<v-divider></v-divider>
		<v-list density="compact" nav>
			<v-list-item :prepend-icon="mdiInformationOutline" title="お知らせ" value="news"></v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import { mdiInformationOutline } from '@mdi/js';

const props = defineProps({
	drawer: Boolean,
});
const emit = defineEmits(['update:drawer']);
const drawer = ref(props.drawer);

// ブログ設定
const blogSettingStore = useBlogSettingStore();

// 親コンポーネントの状態と同期
watch(drawer, (newValue) => {
	emit('update:drawer', newValue);
});
watch(() => props.drawer, (newValue) => {
	drawer.value = newValue;
});
</script>
