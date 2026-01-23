<template>
	<v-card>
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-email</v-icon>
			お問い合わせ
		</v-card-title>
		<v-divider />
		<v-card-text class="pa-4">
			<v-form ref="formRef" @submit.prevent="submitContact">
				<v-text-field
					v-model="contactForm.email"
					label="メールアドレス"
					type="email"
					:rules="emailRules"
					required
					variant="outlined"
					class="mb-4"
				/>
				
				<v-text-field
					v-model="contactForm.subject"
					label="件名"
					:rules="subjectRules"
					required
					variant="outlined"
					class="mb-4"
				/>
				
				<v-textarea
					v-model="contactForm.message"
					label="お問い合わせ内容"
					:rules="messageRules"
					required
					variant="outlined"
					rows="10"
					class="mb-4"
				/>
				
				<div class="d-flex justify-end gap-2">
					<v-btn
						color="grey-lighten-2"
						class="mr-2"
						variant="flat"
						@click="resetForm"
						:disabled="isSubmitting"
					>
						リセット
					</v-btn>
					<v-btn
						color="success"
						class="mr-2"
						variant="flat"
						type="submit"
						:loading="isSubmitting"
						:disabled="isSubmitting"
					>
						送信
					</v-btn>
				</div>
			</v-form>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { useContactStore } from '@/stores/contactStore'
import { AppSwal } from '@/utils/swal'

interface ContactForm {
	email: string
	subject: string
	message: string
}

const contactStore = useContactStore()
const formRef = ref<any>(null)

const contactForm = ref<ContactForm>({
	email: '',
	subject: '',
	message: ''
})

const isSubmitting = ref<boolean>(false)

// バリデーションルール
const emailRules = [
	(v: string) => !!v || 'メールアドレスを入力してください',
	(v: string) => /.+@.+\..+/.test(v) || '有効なメールアドレスを入力してください'
]

const subjectRules = [
	(v: string) => !!v || '件名を入力してください',
	(v: string) => v.length <= 200 || '件名は200文字以内で入力してください'
]

const messageRules = [
	(v: string) => !!v || 'お問い合わせ内容を入力してください',
	(v: string) => v.length <= 5000 || 'お問い合わせ内容は5000文字以内で入力してください'
]

// フォームをリセット
const resetForm = (): void => {
	contactForm.value = {
		email: '',
		subject: '',
		message: ''
	}
	formRef.value?.resetValidation()
}

// お問い合わせを送信
const submitContact = async (): Promise<void> => {
	if (!formRef.value) return
	
	const { valid } = await formRef.value.validate()
	if (!valid) return
	
	isSubmitting.value = true
	
	try {
		await contactStore.create({
			email: contactForm.value.email,
			subject: contactForm.value.subject,
			message: contactForm.value.message
		})
		
		await AppSwal.fire({
			title: '送信完了',
			text: 'お問い合わせを受け付けました。ありがとうございます。',
			icon: 'success',
		})
		
		resetForm()
	} catch (error: any) {
		console.error('お問い合わせ送信エラー:', error)
		AppSwal.fire({
			title: 'エラー',
			text: 'お問い合わせの送信に失敗しました。もう一度お試しください。',
			icon: 'error',
		})
	} finally {
		isSubmitting.value = false
	}
}
</script>