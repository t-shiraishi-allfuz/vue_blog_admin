const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
	transpileDependencies: true
})
module.exports = {
	configureWebpack: {
		resolve: {
			fallback: {
				crypto: require.resolve('crypto-browserify'),
				stream: require.resolve('stream-browserify'),
				vm: require.resolve('vm-browserify'),
			},
		},
	},
};
