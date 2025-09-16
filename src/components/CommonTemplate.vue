<template>
	<v-app>
		<CommonHeader />
		<v-main>
			<v-container fluid>
				<v-row>
					<v-col cols="2" class="sidebar-wrapper">
						<CommonSidemenu />
					</v-col>
					<v-col class="main-content">
						<router-view />
					</v-col>
				</v-row>
			</v-container>
		</v-main>
	</v-app>
</template>

<style scoped>
	.sidebar-wrapper {
		position: fixed;
		top: 64px;
		left: 0;
		width: 25%;
		height: calc(100vh - 64px);
		overflow-y: auto;
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
	}
	.main-content {
		margin-left: 18%;
		padding: 16px;
	}
</style>
