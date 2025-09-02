<template>
	<v-form ref="settingForm" @submit.prevent="createUser">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">ユーザー登録</h4>
			</v-card-title>
			<v-card-text>
				<v-text-field
					:prepend-inner-icon="mdi-email-outline"
					v-model="email"
					label="メールアドレスを入力して下さい"
					type="email" />
				<v-text-field
					:append-inner-icon="visibleIcon"
					:type="visibleType"
					v-model="password"
					label="パスワードを入力して下さい"
					:prepend-inner-icon="mdi-lock-outline"
					@click:append-inner="changeVisible" />
			</v-card-text>
			<v-card-text>
				<router-link to="/user_login">
					登録済みの方はこちら
				</router-link>
			</v-card-text>
			<v-card-actions>
				<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
			</v-card-actions>
		</v-card>
	</v-form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const visibleIcon = ref("mdi-eye-off")
const visibleType = ref('password')

// 入力タイプ切り替え
const changeVisible = () => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

// ファイルアップロードの処理
const createUser = async () => {
	await authStore.create(email.value, password.value)
	router.push('/setting_first')
}
</script>
