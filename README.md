# MPKJ Tools

一个基于 Vue 3、Vite 和 Ant Design Vue 的浏览器端工具集。工具主要在浏览器本地运行，文件处理和音频转换不会上传用户文件。

## 功能

### 财税计算

- 小微企业税负计算器
- 人民币大写转换器

### 文本处理

- 公众号文章编辑器
- 字母大小写转换
- 汉字批量转拼音
- 特殊符号大全
- 字数统计
- 二维码生成器

### 图片与文件

- 图片合并 PDF
- Word 导出 PDF
- 图片批量加水印
- 文件转 Base64
- M4A 批量转 MP3

### 其他

- 密码生成器
- JSON 格式化与校验
- Cron 表达式生成器
- 一年级数学练习
- 一年级语文练习
- 五子棋游戏

## 技术栈

- Vue 3 + Vite
- Vue Router 4
- Vuex 4
- Ant Design Vue
- UEditor + `vue-ueditor-wrap`
- Dexie.js（IndexedDB）
- DOMPurify
- FFmpeg WebAssembly（M4A 转 MP3）
- Sharp（开发期图片转码脚本）

## 环境要求

- Node.js 18 或更高版本
- npm
- 支持 IndexedDB、WebAssembly 和现代 JavaScript API 的浏览器

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问地址为 `http://localhost:5173/`。公众号文章编辑器地址为 `/wxEditor`，M4A 批量转 MP3 地址为 `/m4aToMp3`。

生产构建：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

## 公众号文章编辑器

编辑器使用 UEditor，页面名称为“公众号文章编辑器”，没有替换 UEditor 编辑能力。

素材数据位于：

```text
src/assets/editor_material.json
```

页面首次打开时会将素材导入浏览器 IndexedDB，数据库名为 `mpkj-editor-materials`，包含完整素材表、轻量搜索索引表和数据版本信息。后续分页、分类和关键词搜索从 IndexedDB 查询，不会每次重新解析全部 HTML。

素材 HTML 中的图片已经下载并转为本地 GIF，文件位于：

```text
src/assets/editor_image/
```

图片 URL 与本地文件的对应关系记录在 `src/assets/editor_image/manifest.json`。当前素材引用不再依赖远程图片 CDN。

## 素材维护

从 `editor_material.json` 提取远程图片、下载并转为 GIF：

```bash
npm run download:editor-images
```

脚本支持并发下载、失败重试和已有 GIF 复用。默认并发数为 6，也可以指定并发数：

```bash
npm run download:editor-images -- --concurrency=12
```

仅统计远程图片，不下载：

```bash
npm run download:editor-images -- --dry-run
```

将素材中的远程图片地址替换为本地 GIF 路径：

```bash
npm run localize:editor-images
```

如需根据映射清单恢复远程 URL：

```bash
npm run localize:editor-images -- --restore
```

本地 GIF 通过 Vite 插件在开发环境提供，并在生产构建时复制到 `dist/editor_image`。图片资源体积较大，提交或部署前请确认磁盘空间和 GitHub 仓库容量满足要求。

## 部署到 GitHub Pages

项目提供 Windows 部署脚本：

```bat
deploy.bat
```

脚本会依次执行：

1. `git pull origin`
2. `npm run build`
3. 清理 `docs` 目录（保留 `docs/CNAME`）
4. 将 `dist` 内容复制到 `docs`
5. 提交变更
6. `git push origin`

执行脚本前请确认：

- 已配置 GitHub 远程仓库和推送权限
- 工作区中需要保留的代码已经保存
- 本地 Node.js、npm 和 Git 可以直接在命令行使用
- `docs` 目录存在

## 目录说明

```text
src/
  assets/                 素材数据、本地图片和公共样式
  components/             通用 Vue 组件
  config/                 菜单和工具配置
  services/               IndexedDB 等数据服务
  store/                  Vuex 状态管理
  views/                  首页和工具页面
public/ueditor/           UEditor 静态资源
scripts/                  素材下载和本地化脚本
build/                    Vite 构建期插件
docs/                     GitHub Pages 发布目录
deploy.bat                构建并推送部署脚本
```

## 开发约定

- 新增工具时同步更新路由和 `src/config/menus.js`，确保首页和顶部菜单都能访问。
- 需要持久化的浏览器端数据优先使用 IndexedDB；大数据查询应设计轻量索引和分页。
- 不要将用户选择的文件上传到服务端，除非功能需求明确要求远程服务。
- 修改编辑器素材后，需要同步更新素材数据版本，促使已有浏览器重新导入 IndexedDB。
