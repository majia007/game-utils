import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('./');
const rootDir = path.resolve('./');

// 收集所有HTML文件路径
const pagePathList = [];
!(function collect(files, dir) {
	files.forEach(file => {
		if (dir === rootDir && file === 'template.html') return;
		if (file.startsWith('.')) return;
		const filePath = path.resolve(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			collect(fs.readdirSync(filePath), filePath);
		} else if (file.endsWith('.html') && file !== 'index.html') {
			const htmlPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
			pagePathList.push(htmlPath);
		}
	});
})(files, rootDir);

// 生成索引文件内容的函数
function generateIndexContent(items, title, depth) {
	// 递归生成列表项
	function generateList(items, indent = 1) {
		if (items.length === 0) return '';

		const tabs = '\t'.repeat(indent);
		const listItems = items.map(item => {
			if (item.type === 'file') {
				const href = item.path;
				const button = `&nbsp;<button onclick="openNewWindow('${href}')">小窗口打开</button>`;
				return `${tabs}<li><a href="${href}">${href}</a>${button}</li>`;
			} else if (item.type === 'directory') {
				const href = item.path;
				const button = `&nbsp;<button onclick="openNewWindow('${href}')">小窗口打开</button>`;
				const sublist = generateList(item.children, indent + 2);
				return `${tabs}<li>
${tabs}\t<strong>${href}</strong>&nbsp;<a href="${href}">进入</a>${button}
${tabs}\t<ul>
${sublist}${tabs}\t</ul>
${tabs}</li>`;
			}
		}).join('\n');

		return listItems;
	}

	const listContent = generateList(items);

	// 根据深度确定tools.js的路径
	const toolsPath = depth === 0 ? 'assets/tools.js' : '../'.repeat(depth) + 'assets/tools.js';

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
	<title>${title}</title>
	<script src="${toolsPath}"></script>
</head>
<body>
	<ul>
${listContent}
	</ul>
	<hr>
	<button onclick="openNewWindow()">小窗口打开</button>
</body>
</html>`;
}

// 递归查找需要生成索引文件的目录
function findDirsToIndex(files, dir) {
	const dirsToIndex = [];

	function checkDir(currentFiles, currentDir) {
		// 检查当前目录是否包含除index.html外的HTML文件
		let hasHtmlFiles = false;
		currentFiles.forEach(file => {
			if (file.endsWith('.html') && file !== 'index.html') {
				hasHtmlFiles = true;
			}
		});

		// 如果有HTML文件，需要为该目录生成索引
		if (hasHtmlFiles) {
			dirsToIndex.push(currentDir);
		}

		// 递归检查子目录
		currentFiles.forEach(file => {
			const filePath = path.resolve(currentDir, file);
			if (fs.statSync(filePath).isDirectory()) {
				checkDir(fs.readdirSync(filePath), filePath);
			}
		});
	}

	checkDir(files, dir);
	return dirsToIndex;
}

// 检查目录是否包含非index的HTML文件
function hasNonIndexHtmlFiles(dirPath) {
	const files = fs.readdirSync(dirPath);
	return files.some(file => file.endsWith('.html') && file !== 'index.html');
}

// 查找所有需要生成索引的目录
const dirsToIndex = findDirsToIndex(files, rootDir);

// 为每个需要的目录生成索引文件
dirsToIndex.forEach(dir => {
	// 获取相对于根目录的路径
	const relativeDir = path.relative(rootDir, dir) || '.';

	// 获取目录名作为标题
	const dirName = path.basename(dir) || 'UUUUUUtils';
	const title = dirName === '.' ? 'UUUUUUtils' : dirName;

	// 计算目录深度，用于确定资源引用路径
	const depth = relativeDir === '.' ? 0 : relativeDir.split('/').length;

	// 递归构建目录树结构
	function buildTree(currentRelativeDir) {
		// 获取该目录下的HTML文件（仅当前目录，不包括子目录）
		const currentDirHtmlFiles = pagePathList.filter(pagePath => {
			const pageDir = path.dirname(pagePath);
			// 只包含当前目录的文件
			if (currentRelativeDir === '.') {
				return pageDir === '.';
			} else {
				// 检查文件是否在当前目录下
				return path.dirname(pagePath) === currentRelativeDir;
			}
		});

		// 生成当前目录的相对路径列表
		const relativeHtmlFiles = currentDirHtmlFiles.map(pagePath => {
			if (currentRelativeDir === '.') {
				// 在根目录中，保持完整路径
				return pagePath;
			}
			// 计算相对于当前目录的路径，需要正确处理路径
			const relativePath = path.relative(currentRelativeDir, pagePath).replace(/\\/g, '/');
			// 如果在子目录中，需要去掉前面的../部分
			return relativePath.startsWith('../') ? relativePath.substring(3) : relativePath;
		});

		// 构建当前目录的文件项
		const fileItems = relativeHtmlFiles.map(file => ({
			type: 'file',
			path: file,
		}));

		// 获取当前目录下的子目录，并检查它们是否包含非index的HTML文件
		const subdirItems = [];
		const fullCurrentDir = currentRelativeDir === '.' ? rootDir : path.resolve(rootDir, currentRelativeDir);
		const filesInDir = fs.readdirSync(fullCurrentDir);

		filesInDir.forEach(file => {
			const fullPath = path.resolve(fullCurrentDir, file);
			if (fs.statSync(fullPath).isDirectory()) {
				// 检查子目录是否包含非index的HTML文件
				if (hasNonIndexHtmlFiles(fullPath)) {
					// 添加子目录项
					const relativeSubdirPath = currentRelativeDir === '.' ? file + '/' : file + '/';
					subdirItems.push({
						type: 'directory',
						path: relativeSubdirPath,
						children: buildTree(path.join(currentRelativeDir, file)),
					});
				}
			}
		});

		// 返回合并的项列表
		return [...fileItems, ...subdirItems];
	}

	// 构建当前索引目录的完整树
	const treeItems = buildTree(relativeDir === '.' ? '.' : relativeDir);

	// 对于根目录，我们需要特别处理子目录中的文件路径
	if (relativeDir === '.') {
		const fixedTreeItems = treeItems.map(item => {
			if (item.type === 'directory') {
				// 修复子目录中文件的路径
				const fixedChildren = item.children.map(child => {
					if (child.type === 'file') {
						// 确保子目录中的文件路径包含目录前缀
						return {
							...child,
							path: item.path + child.path,
						};
					}
					return child;
				});
				return {
					...item,
					children: fixedChildren,
				};
			}
			return item;
		});

		// 生成索引文件内容
		const content = generateIndexContent(fixedTreeItems, title, depth);

		// 写入索引文件
		const indexPath = path.resolve(dir, 'index.html');
		fs.writeFileSync(indexPath, content, {encoding: 'utf8'});
	} else {
		// 生成索引文件内容
		const content = generateIndexContent(treeItems, title, depth);

		// 写入索引文件
		const indexPath = path.resolve(dir, 'index.html');
		fs.writeFileSync(indexPath, content, {encoding: 'utf8'});
	}
});

console.log(new Date());
