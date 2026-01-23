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
						@click="chargeCoins(amount)"
					>
						<v-card-text class="text-center">
							<div class="text-h6">{{ amount.toLocaleString() }}</div>
							<div class="text-caption text-grey">コイン</div>
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { useCoinStore } from '@/stores/coinStore'
import { AppSwal } from '@/utils/swal'

const router = useRouter()
const coinStore = useCoinStore()
const { coins, MAX_COINS } = storeToRefs(coinStore)

const selectedAmount = ref<number | null>(null)
const loading = ref<boolean>(false)

const chargeAmounts = [100, 500, 1000, 5000, 10000, 50000]

const chargeCoins = async (amount: number): Promise<void> => {
	selectedAmount.value = amount

	const currentCoins = coins.value || 0
	const newCoins = currentCoins + selectedAmount.value

	if (newCoins > (MAX_COINS.value || 999999)) {
		await AppSwal.fire({
			title: 'エラー',
			text: `チャージ後のコイン数が上限(${(MAX_COINS.value || 999999).toLocaleString()})を超えます`,
			icon: 'error',
		})
		return
	}

	const result = await AppSwal.fire({
		title: '確認',
		text: `${selectedAmount.value.toLocaleString()}コインをチャージしますか？`,
		icon: 'info',
		showConfirmButton: true,
		confirmButtonText: 'チャージする',
	})

	// 購入確認
	if (result && result.isConfirmed) {
		loading.value = true

		try {
			await coinStore.addCoins(selectedAmount.value)
			
			await AppSwal.fire({
				title: 'チャージ完了',
				text: `${selectedAmount.value.toLocaleString()}コインをチャージしました`,
				icon: 'success',
			})

			selectedAmount.value = null
		} catch (err: any) {
			console.error('チャージエラー:', err)
			AppSwal.fire({
				title: 'エラー',
				text: 'チャージに失敗しました',
				icon: 'error',
			})
		} finally {
			loading.value = false
		}
	}
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
