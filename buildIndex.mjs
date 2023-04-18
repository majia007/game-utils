import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('./');
const rootDir = path.resolve('./');

const pagePathList = [];
!(function collect(files, dir) {
	files.forEach(file => {
		if (dir === rootDir && file === 'template.html') return;
		if (file.startsWith('.')) return;
		const filePath = path.resolve(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			collect(fs.readdirSync(filePath), filePath);
		} else if (file.endsWith('.html')) {
			const htmlPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
			pagePathList.push(htmlPath);
		}
	});
})(files, rootDir);

const content = pagePathList.map((pagePath) => {
	const href = pagePath.replace('index.html', '');
	const button = href.includes('eve') ? `&nbsp;<button onclick="openNewWindow('${href}')">小窗口打开</button>` : '';
	return `\t<p><a href="${href}">${href}</a>${button}<p>`;
}).join('\r\n');

const template = fs.readFileSync('./template.html', {encoding: 'utf8'});
fs.writeFileSync('index.html', template.replace('\t<!-- content -->', content), {encoding: 'utf8'});

console.log(new Date());
