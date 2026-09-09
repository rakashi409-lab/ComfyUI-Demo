# ComfyUI Demo

一个可离线使用的 ComfyUI 风格工作流演示器。支持自由背景分组、颜色标签、JSON 导入导出、自动保存、图片恢复和可停止的执行模拟，无需安装模型或配置显卡。

**在线使用：[rakashi409-lab.github.io/ComfyUI-Demo](https://rakashi409-lab.github.io/ComfyUI-Demo/)**

**免安装包：[下载 ComfyUI-Demo v2.0.0 ZIP](https://github.com/rakashi409-lab/ComfyUI-Demo/raw/refs/heads/main/downloads/ComfyUI-Demo-v2.0.0.zip)**

解压后双击 `ComfyUI.html` 或 `启动演示.bat`。`index.html` 与 `ComfyUI.html` 都是完整独立页面，不依赖网络资源。推荐使用近期版本的 Chrome / Edge / Firefox。

## 功能

| 功能 | 说明 |
|---|---|
| 背景分组与标签 | 任意 HEX 颜色、连续颜色选择、透明度、名称、字号、宽高；拖动标题移动，右边/底边/右下角缩放 |
| 分组与节点联动 | 默认携带完整包围的节点，Alt 拖动只移动分组框；删除分组保留节点 |
| 工作流复用 | JSON 保存节点、连线、分组、参数、视图、输入图、结果图及演示图片播放位置 |
| 自动保存 | 使用 IndexedDB 保存到当前浏览器，刷新或再次打开同一地址恢复；状态栏显示保存状态 |
| 节点编辑 | 19 种节点、类型匹配连线、参数校验、复制、撤销和重做 |
| 执行模拟 | 按连线依赖运行、轻节点并行、采样步数联动、停止、循环检测、异常恢复 |
| 随机种子 | fixed / increment / decrement / randomize，成功完成后更新 |
| 图片演示 | 按顺序播放预上传成品图、回退与重置；节点结果和图像面板支持下载 |
| 常用面板 | 工作流信息、模型名称管理、图像浏览、通知记录、保存与速度设置 |

> 这是演示软件。节点参数和模型名称用于工作流讲解；执行结果来自预上传图片。不会实际加载模型、采样或推理。

## 快速上手

1. 在左侧节点库点击「加载工作流」，打开包含五个彩色分组的预设。
2. 点击「＋ 分组」添加自己的标签框，或点击分组标题旁的编辑按钮修改名称、颜色和尺寸。
3. 在「加载图像」节点上传参考图，在左侧底部「生成历史」上传预生成的成品图。
4. 点击「执行」。运行中按钮切换为「停止」，完成后可下载输出图。
5. 点击「导出 JSON」保存完整备份。下一次通过「导入 JSON」恢复到任意设备。

## 保存说明

- 自动保存只属于当前浏览器和当前站点，不会上传到服务器。页面仅在确认存储事务完成后显示「已保存」。
- 开启自动保存时，编辑停止约 250 ms 后保存；关闭后可手动点「保存」。
- 清理站点数据、隐私窗口、浏览器禁止本地存储、移动本地 HTML 文件、换浏览器或换域名，均可能使原自动保存不可访问。跨设备和长期备份请使用 JSON。
- 图片内嵌在 JSON 中，文件可能较大。单张图片限 32 MB，JSON 导入限 150 MB。支持 PNG / JPEG / WebP / GIF / BMP / AVIF。
- 导入支持本程序 v2 完整备份和节点库内已支持类型的 ComfyUI 画布 JSON。遇到未知节点、无效连线、循环或越界参数会拒绝导入，不覆盖当前画布。原版 JSON 引用的外部图片需重新上传。
- 本程序导出的格式为 `comfyui-demo`，用于完整演示恢复，不是 ComfyUI 推理 API 格式。

## 开发

源代码维护在 `src/`；发布页面由脚本生成，不应直接编辑生成的两个 HTML 文件。

```bash
python scripts/build.py
python scripts/build.py --package
```

第二条命令同时更新 `downloads/ComfyUI-Demo-v2.0.0.zip`。用户使用时不需要 Python 或 Node.js。

开发测试使用 Node.js 20 或更新版本；两个开发依赖仅用于 DOM 和 IndexedDB 行为测试，不会打包进用户页面：

```bash
npm ci
npm test
```

| 路径 | 用途 |
|---|---|
| `src/shell.html` | 页面结构与操作入口 |
| `src/styles.css`、`src/editor.css` | 原始界面与分组编辑器样式 |
| `src/app.js` | 节点定义、画布、连线、基础控件 |
| `src/features.js` | 分组、存储、导入校验、执行和常用面板 |
| `scripts/build.py` | 构建独立 HTML 与免安装 ZIP |
| `tests/` | 数据、编辑器与执行行为测试 |

详细操作见 [使用说明](使用说明.md)，版本记录见 [CHANGELOG](CHANGELOG.md)。

## GitHub Pages

正确访问地址为 `https://rakashi409-lab.github.io/ComfyUI-Demo/`，必须包含项目路径 `/ComfyUI-Demo/`。源码仓库地址不是演示页面地址。

本仓库使用 GitHub Pages 从 `main` 分支根目录发布。根目录包含完整 `index.html`、兼容入口 `ComfyUI.html` 和 `.nojekyll`。如部署设置被修改，请在 Settings → Pages 选择 **Deploy from a branch → main → /(root)**；部署状态可在 Actions 的 pages build and deployment 中查看。无需填写 Custom domain。

## 许可证

沿用原项目的 MIT 许可声明。
