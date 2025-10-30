# SVG打印功能说明

## 概述

PrintProxy 现已支持 SVG（可缩放矢量图形）文件的打印功能。SVG 文件将自动转换为高质量的 PNG 图片进行打印，支持所有现有的打印选项和质量增强功能。

## 新增功能特性

### ✅ 支持的功能
- **SVG 文件打印**：支持标准 SVG 1.1 格式
- **自动格式转换**：SVG → PNG → 打印
- **矢量图形保真**：高 DPI 转换保持图形清晰度
- **颜色模式支持**：彩色、灰度、黑白打印
- **尺寸自适应**：支持自定义纸张尺寸和缩放模式
- **预览功能**：生成 SVG 文件的预览图
- **质量增强**：锐化、对比度优化等

### 🔧 技术实现
- 使用 `cairosvg` 库进行 SVG 到 PNG 的转换
- 复用现有的图片打印流程（GDI）
- 支持高 DPI 渲染（最高 1200 DPI）
- 智能缩放算法保持图形质量

## 使用方法

### 1. API 调用

SVG 文件现已加入支持的文件类型列表：

```python
# 支持的文件类型
ALLOWED_FILE_TYPES = {
    "pdf", "png", "jpg", "jpeg", "bmp", 
    "svg",  # 新增
    "txt", "doc", "docx", "xls", "xlsx"
}
```

### 2. 打印请求示例

```python
import base64
import requests

# 读取 SVG 文件
with open("label.svg", "rb") as f:
    svg_content = f.read()

# 构建打印请求
request_data = {
    "title": "SVG标签打印",
    "file_type": "svg",  # 指定为 SVG 类型
    "content_base64": base64.b64encode(svg_content).decode(),
    "copies": 1,
    "priority": 5,
    "media_size": "40x60mm@300dpi",  # 高分辨率打印
    "color_mode": "color",           # 彩色打印
    "fit_mode": "fill",              # 填满纸张
    "auto_rotate": True,
    "enhance_quality": True
}

# 发送请求
response = requests.post(
    "http://localhost:8568/api/jobs/",
    headers={"Authorization": f"Bearer {token}"},
    json=request_data
)
```

### 3. 支持的打印选项

| 选项 | 说明 | SVG 特殊处理 |
|------|------|-------------|
| `media_size` | 纸张尺寸 | 自动缩放 SVG 以适应尺寸 |
| `color_mode` | 颜色模式 | `color`/`grayscale`/`monochrome` |
| `fit_mode` | 缩放模式 | `fill`/`contain`/`cover`/`stretch` |
| `dpi` | 分辨率 | 影响 SVG 转换质量 |
| `enhance_quality` | 质量增强 | 应用锐化和对比度优化 |
| `auto_rotate` | 自动旋转 | 根据纸张方向自动旋转 |

## 缩放模式详解

### fill（推荐）
- 完整显示 SVG 内容，不超出纸张边界
- 保持宽高比，可能有留白
- 适合标签和图标打印

### contain
- 完整显示 SVG，可能有较多留白
- 确保内容不被裁剪

### cover
- 填满整个纸张，可能裁剪部分内容
- 适合背景图案

### stretch
- 拉伸填充整个纸张
- 可能导致图形变形

## 质量优化建议

### 1. DPI 设置
```python
# 标准质量（默认）
"media_size": "40x60mm@203dpi"

# 高质量打印
"media_size": "40x60mm@300dpi"

# 超高质量（大尺寸打印）
"media_size": "100x150mm@600dpi"
```

### 2. 颜色模式选择
```python
# 彩色打印（保持 SVG 原始颜色）
"color_mode": "color"

# 黑白打印（自动转换，适合标签）
"color_mode": "monochrome"

# 灰度打印（中间选择）
"color_mode": "grayscale"
```

### 3. SVG 文件优化
- 使用相对单位（如 `viewBox`）而非固定像素
- 避免过于复杂的路径和滤镜
- 使用标准字体或嵌入字体
- 控制文件大小（建议 < 1MB）

## 示例 SVG 文件

### 简单标签
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="40mm" height="60mm" viewBox="0 0 40 60" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="100%" height="100%" fill="white" stroke="black" stroke-width="0.5"/>
  
  <!-- 标题 -->
  <text x="20" y="10" text-anchor="middle" font-size="3" font-weight="bold">
    产品标签
  </text>
  
  <!-- 二维码区域 -->
  <rect x="10" y="15" width="20" height="20" fill="black"/>
  <rect x="12" y="17" width="16" height="16" fill="white"/>
  
  <!-- 文本信息 -->
  <text x="20" y="45" text-anchor="middle" font-size="2">
    批次: BATCH-001
  </text>
</svg>
```

### 复杂设计
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="60mm" height="40mm" viewBox="0 0 60 40" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4CAF50"/>
      <stop offset="100%" style="stop-color:#45a049"/>
    </linearGradient>
  </defs>
  
  <!-- 渐变背景 -->
  <rect width="100%" height="100%" fill="url(#bg)"/>
  
  <!-- 公司 Logo 区域 -->
  <circle cx="10" cy="10" r="6" fill="white" opacity="0.9"/>
  <text x="10" y="13" text-anchor="middle" font-size="2" fill="#333">LOGO</text>
  
  <!-- 产品信息 -->
  <text x="30" y="15" text-anchor="middle" font-size="4" fill="white" font-weight="bold">
    PrintProxy
  </text>
  <text x="30" y="25" text-anchor="middle" font-size="2" fill="white">
    SVG 打印测试
  </text>
</svg>
```

## 错误处理

### 常见错误及解决方案

1. **缺少 cairosvg 库**
   ```
   错误: 缺少 cairosvg 库，无法处理 SVG 文件
   解决: pip install cairosvg
   ```

2. **SVG 文件格式错误**
   ```
   错误: SVG转PNG转换失败
   解决: 检查 SVG 文件是否为有效的 XML 格式
   ```

3. **内存不足**
   ```
   错误: 转换大型 SVG 文件时内存不足
   解决: 降低 DPI 或简化 SVG 内容
   ```

## 性能考虑

### 转换时间
- 简单 SVG（< 50KB）：< 1 秒
- 复杂 SVG（100-500KB）：1-3 秒
- 大型 SVG（> 1MB）：3-10 秒

### 内存使用
- 转换过程中会占用额外内存
- 高 DPI 转换需要更多内存
- 建议监控系统资源使用情况

## 测试和验证

### 1. 运行测试示例
```bash
# 运行 SVG 打印示例
python examples/print_svg_example.py
```

### 2. 单元测试
```bash
# 运行 SVG 功能测试
python -m pytest tests/test_svg_support.py -v
```

### 3. 预览功能测试
```python
# 获取 SVG 预览
response = requests.get(
    f"http://localhost:8568/api/jobs/{job_id}/preview",
    headers={"Authorization": f"Bearer {token}"}
)
```

## 兼容性说明

### 支持的 SVG 特性
- ✅ 基本形状（rect, circle, ellipse, line, polyline, polygon）
- ✅ 路径（path）
- ✅ 文本（text, tspan）
- ✅ 变换（transform）
- ✅ 渐变（linearGradient, radialGradient）
- ✅ 图案（pattern）
- ✅ 基本滤镜

### 限制和注意事项
- ❌ 不支持动画（animation）
- ❌ 不支持脚本（script）
- ❌ 外部资源引用可能无法加载
- ⚠️ 复杂滤镜可能影响性能
- ⚠️ 非标准字体需要系统支持

## 更新日志

### v1.1.0 (2025-01-27)
- ✅ 新增 SVG 文件类型支持
- ✅ 实现 SVG 到 PNG 自动转换
- ✅ 支持 SVG 预览功能
- ✅ 集成现有打印选项和质量增强
- ✅ 添加完整的测试用例和示例

---

## 技术支持

如有问题或建议，请：
1. 查看日志文件：`%APPDATA%\PrintProxy\logs\`
2. 检查 API 文档：`http://localhost:8568/docs`
3. 运行测试示例验证功能
4. 提交 Issue 或联系技术支持
