# 打印选项参考

## 1. Core Summary

打印选项控制任务的输出效果，包括纸张尺寸、颜色模式、缩放方式和质量增强。所有选项在创建任务时通过 `PrintJobCreate` 模型传入。

## 2. Source of Truth

- **Primary Code:** `app/schemas/print_job.py` - 打印选项字段定义和验证
- **Processing Logic:** `app/services/job_service.py` - 选项解析和应用逻辑
- **Utility Functions:** `app/utils/print_utils.py` - 尺寸解析和图片优化算法

## 3. 打印选项参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|-----|
| `media_size` | string | null | 纸张尺寸，格式: `40x60mm` 或 `40x60mm@300dpi` |
| `dpi` | int | 203 | 打印分辨率 (72-1200) |
| `color_mode` | string | null | 颜色模式: `color`, `grayscale`, `monochrome` |
| `fit_mode` | string | "fill" | 缩放模式: `contain`, `fill`, `cover`, `stretch` |
| `auto_rotate` | bool | true | 自动旋转图片以适配纸张方向 |
| `enhance_quality` | bool | true | 启用质量增强（锐化、对比度优化） |
| `scale_to_fit` | bool | false | 将高分辨率图片缩放到纸张尺寸 |
| `copies` | int | 1 | 打印份数 |
| `duplex` | string | null | 双面打印模式 |

## 4. 支持的文件类型

定义位置: `app/schemas/print_job.py:9-21`

| 类型 | 扩展名 | 打印模式 |
|-----|-------|---------|
| 图片 | png, jpg, jpeg, bmp | GDI 打印 |
| 文档 | pdf | PyMuPDF 渲染 + GDI |
| Office | doc, docx, xls, xlsx | COM 自动化 |
| 文本 | txt | RAW 打印 |
| 矢量 | svg | 已移除支持 |

## 5. 缩放模式说明

定义位置: `app/utils/print_utils.py:88-131`

- **contain:** 完整显示图片，可能有留白
- **fill:** 完整显示内容，不超出纸张边界（推荐用于标签打印）
- **cover:** 填满目标区域，可能裁剪
- **stretch:** 拉伸填充，可能变形

## 6. 质量增强算法

定义位置: `app/utils/print_utils.py:135-258`

| 算法 | 函数 | 说明 |
|-----|------|-----|
| 锐化 | `enhance_image_quality` | PIL ImageFilter.SHARPEN |
| 对比度 | `enhance_image_quality` | 黑白 +20%, 彩色 +10% |
| 抖动 | `convert_to_monochrome_optimized` | Floyd-Steinberg 算法 |
| 重采样 | `get_optimal_resampling_filter` | LANCZOS 高质量缩放 |

## 7. 纸张尺寸格式

定义位置: `app/utils/print_utils.py:15-59`

支持格式:
- `40x60mm` - 毫米单位
- `2x3inch` - 英寸单位
- `40x60mm@300dpi` - 带 DPI 指定

转换公式: `pixels = mm / 25.4 * dpi`
