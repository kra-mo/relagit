/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');

/**
 * @type {{
	commit: string;
	date: string;
	env: 'development' | 'production';
}}
 */
const buildInfo = JSON.parse(fs.readFileSync('./dist/build_info.json', 'utf-8'));

/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
	extends: null,
	extraMetadata: {
		main: 'dist/main.js'
	},
	appId: 'com.relagit.app',
	productName: 'RelaGit',
	artifactName: '${productName}-${os}.${ext}',
	directories: {
		output: 'out'
	},
	icon: buildInfo.env === 'development' ? './build/dev' : './build/icon',
	asar: false, // we cannot build as asar because vscode-oniguruma needs to be required from starry-night
	dmg: {
		background: './build/background.png',
		icon: './build/dmg.icns',
		iconSize: 72,
		contents: [
			{
				x: 462,
				y: 160,
				type: 'link',
				path: '/Applications'
			},
			{
				x: 155,
				y: 160,
				type: 'file'
			}
		]
	},
	mac: {
		identity: null,
		category: 'public.app-category.developer-tools',
		darkModeSupport: true,
		artifactName: '${productName}-${os}-${arch}.${ext}',
		target: [
			{
				target: 'dmg',
				arch: ['arm64', 'x64']
			},
			{
				target: 'zip',
				arch: ['arm64', 'x64']
			}
		]
	},
	linux: {
		category: 'Developer',
		maintainer: 'TheCommieAxolotl',
		target: ['deb', 'tar.gz', 'rpm']
	},
	win: {
		target: ['zip']
	},
	files: ['dist', 'public', 'package.json', 'LICENSE']
};

module.exports = config;
