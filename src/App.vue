<template>
	<router-view />
</template>

<script setup></script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss">
	html {
		height: 100%;
	}
	header {
		padding: 0 16px;
	}
	body {
		position: relative;
		height: auto!important;
		height: 100%;
		min-height: 100%;
		line-height: 1.3;
		background: #fff;
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
		font-size: 83%;
		min-width: 980px;
	}
	ul, li {
		list-style-type: none;
	}
	img {
		vertical-align: bottom;
		max-width: 100%;
		height: auto;
	}
	a img {
		border: none;
	}
	* html body { font-family: "ＭＳ Ｐゴシック",sans-serif; }
	*:first-child+html body { font-family: "ＭＳ Ｐゴシック",sans-serif; }

	input {
		vertical-align: middle;
	}

	label {
		display: block;
		font-weight: bold;
		margin-bottom: 8px;
	}
	.form-group {
		margin-bottom: 16px;
	}
    .ql-toolbar {
        border: 1px solid #ccc;
        border-bottom: none;
    }       
        
    .ql-editor {
        font-size: 16px;
        min-height: 200px;
    }

	.ql-snow .ql-editor img {
		max-width: 50% !important;
	}
	.v-label {
		margin-bottom: 0;
	}
	.blog-detail .v-card-title {
		font-size: 1.5rem;
	}
	.blog-detail img {
		max-width: 50% !important;
	}
</style>
