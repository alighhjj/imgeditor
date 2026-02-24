# 图片保存到相册功能说明

## 功能说明

导出的图片会直接保存到 Android 设备的相册中（/storage/emulated/0/Pictures/imgeditor/），无需手动下载。

## 技术实现

1. **Filesystem Plugin** - 使用 Capacitor Filesystem Plugin 将图片保存到公共目录
2. **MediaScanner Plugin** - 自定义 Android 插件，使用 MediaScannerConnection 扫描文件
3. **Android 权限** - 已配置存储相关权限（包括 Android 10+ 的分区存储权限）

## 权限配置

AndroidManifest.xml 中已添加以下权限：
- WRITE_EXTERNAL_STORAGE
- READ_EXTERNAL_STORAGE
- READ_MEDIA_IMAGES（Android 10+）
- READ_MEDIA_VIDEO
- READ_MEDIA_AUDIO
- INTERNET
- CAMERA

## 使用步骤

1. **构建 Android 应用**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **在 Android Studio 中构建并运行**
   - 打开 android 目录
   - 选择 Build → Rebuild Project
   - 运行到设备

3. **测试功能**
   - 打开应用
   - 加载一张图片
   - 编辑图片
   - 点击"导出"按钮
   - 系统会请求存储权限
   - 授权后，图片会保存到相册

## 文件位置

- **应用包名**: com.imageeditor.app
- **保存路径**: /storage/emulated/0/Pictures/imgeditor/
- **文件名格式**: imgeditor-{timestamp}.png

## 注意事项

1. **Android 版本兼容性**
   - Android 10 及以下：使用传统存储访问
   - Android 11+：使用分区存储（推荐使用 MediaStore API，当前使用兼容方案）

2. **首次使用权限**
   - 首次导出时会请求存储权限，请允许

3. **媒体扫描延迟**
   - 图片保存后需要几秒钟才能在相册中显示
   - 媒体扫描是异步操作，可能会受系统影响

## 自定义插件

媒体扫描插件位于：`android/capacitor-mediascanner/`

如果需要修改媒体扫描逻辑，可以直接编辑 `CapacitorMediaScanner.java` 文件。

## 故障排除

1. **图片没有显示在相册**
   - 检查权限是否已授予
   - 检查文件路径是否正确
   - 等待几秒钟让媒体扫描完成

2. **无法保存图片**
   - 确认存储权限已授予
   - 检查设备是否有足够的存储空间
   - 查看日志获取详细错误信息

3. **应用崩溃**
   - 重新同步 Capacitor：`npx cap sync`
   - 在 Android Studio 中查看 Logcat 日志
