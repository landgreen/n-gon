module.exports = {
	globDirectory: '/app/',
	globPatterns: [
		'**/*.{ico,html,js,css}'
	],
	swDest: '/app/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};