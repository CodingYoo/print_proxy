# 如何添加新的文件格式支持

添加新文件格式需要修改三个关键位置：类型定义、载荷准备和打印执行。

## 步骤

1. **注册文件类型:** 在 `app/schemas/print_job.py:9-21` 的 `ALLOWED_FILE_TYPES` 集合中添加新类型。

2. **定义类型分组:** 在 `app/services/job_service.py:65-69` 添加类型分组常量（如 `NEW_FILE_TYPES = {"ext1", "ext2"}`）。

3. **实现载荷准备:** 在 `app/services/job_service.py:295-314` 的 `_prepare_print_payload` 函数中添加分支，返回打印模式和内容。

4. **实现打印函数:** 创建 `_print_with_xxx` 函数，参考现有实现：
   - GDI 模式: `_print_image_with_gdi` (`job_service.py:373-511`)
   - COM 模式: `_print_with_word` (`job_service.py:317-343`)

5. **注册打印分发:** 在 `app/services/job_service.py:625-745` 的 `_send_to_printer` 函数中添加模式处理分支。

6. **验证测试:** 创建测试任务，确认打印流程正常工作。

## 打印模式选择指南

| 场景 | 推荐模式 | 说明 |
|-----|---------|-----|
| 图像类文件 | `image_gdi` | 使用 PIL 解析后通过 GDI 打印 |
| 需要渲染的文档 | `pdf_gdi` | 渲染为图像后打印 |
| 有原生应用支持 | COM 自动化 | 调用 Word/Excel 等应用 |
| 纯文本/原始数据 | `raw` | 直接发送到打印机 |
| 无法处理的格式 | `file` | 使用 ShellExecute 调用系统关联程序 |

## 质量增强配置

新格式如需支持质量增强，在打印函数中调用 `app/utils/print_utils.py` 的优化函数：

- `optimize_image_for_print`: 综合优化（锐化、对比度、颜色转换）
- `enhance_image_quality`: 单独的质量增强
- `convert_to_monochrome_optimized`: 黑白转换（Floyd-Steinberg 抖动）
