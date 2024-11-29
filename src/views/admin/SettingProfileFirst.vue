<template>
	<CommonLoginTemplate>
		<v-form ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">プロフィール設定 1/2</h4>
				</v-card-title>
				<v-card-text>
					<v-text-field v-model="blogSettingStore.tempSetting.title" label="ブログのタイトルを入力して下さい" type="text" />
					<v-text-field v-model="blogSettingStore.tempSetting.description" label="ブログの説明を入力して下さい" type="text" />
					<v-select
						v-model="blogSettingStore.tempSetting.category"
						:items="['一般','アダルト']"
						label="カテゴリー選択">
					</v-select>
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

// ブログ設定更新
const updateSetting = async () => {
	try {
		await blogSettingStore.update(ref(null));
		router.push('/setting_profile_icon');
	} catch(error) {
		console.log(error);
		alert(error);
	}
};
</script>
