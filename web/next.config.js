const { BUILD_DIR } = require("./build-dir.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Este proyecto vive dentro de la carpeta del editor local, que tiene
	// su propio package-lock.json: evita que Next confunda la raíz.
	turbopack: {
		root: __dirname,
	},
	// Include the Remotion bundle in the API route
	outputFileTracingIncludes: {
		"/api/render": [
			"./" + BUILD_DIR + "/**/*",
			"./render.ts",
			"./ensure-browser.ts",
		],
	},
};

module.exports = nextConfig;
