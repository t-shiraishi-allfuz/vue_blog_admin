<template>
	<BlogEditTemplate :blog="blog" :isUpdate="false" />
</template>

<script setup>
import { ref } from 'vue';
import BlogEditTemplate from '@/components/BlogEditTemplate';

const blog = ref({
	uid: null,
	title: "",
	summary: "",
	content: "",
	category_id: null,
	isPublished: false,
	thumbUrl: null,
	createdAt: null,
	updatedAt: null
});
</script>
