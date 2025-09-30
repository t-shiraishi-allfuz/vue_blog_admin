<template>
	<div class="not-found">
		<h1>404 - ページが見つかりません</h1>
		<p>申し訳ありませんが、お探しのページは存在しません。</p>
		<router-link to="/">ホームへ戻る</router-link>
	</div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 100px;
}

h1 {
  font-size: 2rem;
  color: #ff5252;
}

p {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

a {
  color: #42b983;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
