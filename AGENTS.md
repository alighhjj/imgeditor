# AI Agents 配置

## 项目信息

这是一个基于 Capacitor + Vue 3 的图片编辑 Android 应用项目。

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 同步 Capacitor
npx cap sync android

# 添加 Android 平台（如果还没有）
npx cap add android
```

## 代码检查

运行以下命令检查代码：
```bash
npm run type-check
```

## 构建流程

1. Web 构建使用 Vite
2. Capacitor 同步到 android 目录
3. GitHub Actions 自动构建 APK

## 注意事项

- 不要修改 `android/` 目录中的文件（它会在构建时自动生成）
- 所有代码修改在 `src/` 目录中进行
- 使用 Vue 3 Composition API
- 使用 TypeScript 严格模式
