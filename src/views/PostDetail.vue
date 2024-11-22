<template>
	<BlogEditTemplate :blog="blog" :isUpdate="true" />
</template>

<script setup>
import { ref, defineProps } from 'vue';
import BlogEditTemplate from '@/components/BlogEditTemplate';

const props = defineProps({
	blog: {
		type: Object,
		required: true,
	},
});
const blog = ref(props.blog);
</script>
