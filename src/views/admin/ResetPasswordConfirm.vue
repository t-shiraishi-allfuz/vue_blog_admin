<template>
	<CommonLoginTemplate>
		<v-form ref="settingForm" @submit.prevent="resetPassword">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">新しいパスワード設定</h4>
				</v-card-title>
				<v-card-text>
					<v-text-field
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						v-model="password"
						label="新しいパスワードを入力して下さい"
						:prepend-inner-icon="mdiLockOutline"
						@click:append-inner="changeVisible" />
					<v-text-field
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						v-model="confirmPassword"
						label="もう一度新しいパスワードを入力して下さい"
						:prepend-inner-icon="mdiLockOutline"
						@click:append-inner="changeVisible" />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit" @click="resetPassword">送信</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</CommonLoginTemplate>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import {
	mdiEyeOff,
	mdiEye,
	mdiLockOutline
} from '@mdi/js';

const route = useRoute();
const oobCode = route.query.oobCode;

const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const visibleIcon = ref(mdiEyeOff);
const visibleType = ref('password');

// 入力タイプ切り替え
const changeVisible = () => {
	visibleIcon.value = visibleIcon.value === mdiEyeOff ? mdiEye : mdiEyeOff;
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password';
}

// パスワードリセット
const resetPassword = async () => {
	if (password.value !== confirmPassword.value) {
		alert('パスワードが一致しません');
		return;
	}

	try {
		await authStore.resetPasswordConfirm(oobCode, password.value);
		alert('パスワードがリセットされました');

		await authStore.initializeAuth();
		router.push('/user_login');
	} catch(error) {
		alert(error);
	}
};

onMounted(async () => {
	if (!oobCode) {
		alert('パスワード再設定コードがありません');
	}
});
</script>

<style scoped>
	input[type="email"] {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
