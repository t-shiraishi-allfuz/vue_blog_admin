<template>
	<v-form ref="settingForm" @submit.prevent="loginUser">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">ログイン</h4>
			</v-card-title>
			<v-card-text>
				<v-text-field
					v-model="email"
					:prepend-inner-icon="mdi-email-outline"
					label="メールアドレスを入力して下さい"
					type="email" />
				<v-text-field
					v-model="password"
					:prepend-inner-icon="mdi-lock-outline"
					:append-inner-icon="visibleIcon"
					:type="visibleType"
					label="パスワードを入力して下さい"
					@click:append-inner="changeVisible" />
			</v-card-text>
			<v-card-text>
				<router-link to="/reset_password">
					パスワードを忘れた方はこちら
				</router-link>
			</v-card-text>
			<v-card-text>
				<router-link to="/user_create">
					新規登録はこちら
				</router-link>
			</v-card-text>
			<v-card-actions justify="center">
				<v-btn color="primary" variant="flat" type="submit">ログイン</v-btn>
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

// ログイン処理
const loginUser = async () => {
	await authStore.login(email.value, password.value)
	if (!authStore.error) {
		router.push('/')
	}
}
</script>
