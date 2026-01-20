<template>
	<v-card>
		<v-card-title class="d-flex align-center">
			<img
				src="@/assets/images/img_coin.png"
				alt="コイン"
				class="mr-2 img-coin"
			/>
			コインチャージ
		</v-card-title>
		<v-divider />
		<v-card-text class="pa-6">
			<div class="text-center mb-6">
				<div class="text-h4 mb-2">現在の所持コイン</div>
				<div class="text-h3 text-amber-darken-2 font-weight-bold">
					{{ (coins || 0).toLocaleString() }}
				</div>
				<div class="text-caption text-grey mt-2">
					上限: {{ (MAX_COINS || 999999).toLocaleString() }} コイン
				</div>
			</div>

			<v-divider class="my-6" />

			<div class="text-subtitle-1 mb-4">チャージ金額を選択</div>
			<v-row>
				<v-col
					v-for="amount in chargeAmounts"
					:key="amount"
					cols="6"
					md="4"
				>
					<v-card
						:class="{ 'border-primary': selectedAmount === amount }"
						class="charge-card cursor-pointer"
						variant="outlined"
						@click="selectAmount(amount)"
					>
						<v-card-text class="text-center">
							<div class="text-h6">{{ amount.toLocaleString() }}</div>
							<div class="text-caption text-grey">コイン</div>
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
		</v-card-text>
		<v-divider />
		<v-card-actions>
			<v-spacer />
			<v-btn
				color="grey-lighten-4"
				variant="flat"
				@click="goBack"
			>
				キャンセル
			</v-btn>
			<v-btn
				color="success"
				variant="flat"
				:loading="loading"
				:disabled="!selectedAmount || selectedAmount <= 0"
				@click="chargeCoins"
			>
				<img
					src="@/assets/images/img_coin.png"
					alt="コイン"
					class="mr-2 img-coin"
				/>
				チャージ
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import { useCoinStore } from '@/stores/coinStore'
import Swal from 'sweetalert2'

const router = useRouter()
const coinStore = useCoinStore()
const { coins, MAX_COINS } = storeToRefs(coinStore)

const selectedAmount = ref<number | null>(null)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

const chargeAmounts = [100, 500, 1000, 5000, 10000, 50000]

const selectAmount = (amount: number): void => {
	selectedAmount.value = amount
	error.value = null
}

const chargeCoins = async (): Promise<void> => {
	if (!selectedAmount.value || selectedAmount.value <= 0) {
		error.value = 'チャージ金額を選択してください'
		return
	}

	if (selectedAmount.value > (MAX_COINS.value || 999999)) {
		error.value = `チャージ金額は${(MAX_COINS.value || 999999).toLocaleString()}コイン以下である必要があります`
		return
	}

	const currentCoins = coins.value || 0
	const newCoins = currentCoins + selectedAmount.value

	if (newCoins > (MAX_COINS.value || 999999)) {
		error.value = `チャージ後のコイン数が上限(${(MAX_COINS.value || 999999).toLocaleString()})を超えます`
		return
	}

	loading.value = true
	error.value = null

	try {
		await coinStore.addCoins(selectedAmount.value)
		
		await Swal.fire({
			title: 'チャージ完了',
			text: `${selectedAmount.value.toLocaleString()}コインをチャージしました`,
			icon: 'success',
			confirmButtonColor: '#27C1A3',
			confirmButtonText: 'OK'
		})

		selectedAmount.value = null
	} catch (err: any) {
		error.value = err.message || 'チャージに失敗しました'
		console.error('チャージエラー:', err)
	} finally {
		loading.value = false
	}
}

const goBack = (): void => {
	router.back()
}

onMounted(async () => {
	await coinStore.getCoins()
})
</script>

<style scoped>
.charge-card {
	transition: all 0.2s;
}

.charge-card:hover {
	transform: scale(1.05);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.border-primary {
	border: 2px solid #1976d2 !important;
}

.cursor-pointer {
	cursor: pointer;
}
.img-coin {
	width: 24px;
	height: 24px;
	object-fit: contain;
}
</style>

