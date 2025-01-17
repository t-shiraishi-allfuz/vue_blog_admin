<template>
	<CommonLoginTemplate>
		<v-form v-if="setting" ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">プロフィール設定 1/2</h4>
				</v-card-title>
				<v-card-text>
					<v-text-field
						label="ブログのタイトルを入力して下さい"
						v-model="setting.title"
					/>
					<v-text-field
						label="ブログの説明を入力して下さい"
						v-model="setting.description"
					/>
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</CommonLoginTemplate>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogSettingStore } from '@/stores/blogSettingStore';

// ブログ設定
const router = useRouter();
const blogSettingStore = useBlogSettingStore();

const setting = ref(blogSettingStore.blogSetting);

// ブログ設定更新
const updateSetting = async () => {
	try {
		await blogSettingStore.update(null, setting.value);
		router.push('/setting_profile_icon');
	} catch(error) {
		alert(error);
	}
}
</script>
