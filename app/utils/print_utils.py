"""
打印工具函数模块
提供打印尺寸解析、DPI 计算、图片优化等辅助功能
"""
from __future__ import annotations

import re
from typing import Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import io

# SVG 支持已移除以简化依赖和提高兼容性


def parse_media_size(media_size: Optional[str], dpi: int = 203) -> Optional[Tuple[int, int]]:
    """
    解析 media_size 参数，返回像素尺寸 (width_px, height_px)
    
    支持格式：
    - "40x60mm" - 毫米单位
    - "2x3inch" - 英寸单位
    - "40x60mm@300dpi" - 带 DPI 指定
    - None - 返回 None，使用打印机默认设置
    
    Args:
        media_size: 纸张尺寸字符串
        dpi: 默认 DPI（当 media_size 中未指定时使用）
    
    Returns:
        (width_px, height_px) 或 None
    """
    if not media_size:
        return None
    
    # 解析格式：40x60mm@203dpi 或 40x60mm
    pattern = r'^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|inch)(?:@(\d+)dpi)?$'
    match = re.match(pattern, media_size.lower().strip())
    
    if not match:
        return None
    
    width_str, height_str, unit, dpi_str = match.groups()
    width = float(width_str)
    height = float(height_str)
    
    # 如果指定了 DPI，使用指定的值
    if dpi_str:
        dpi = int(dpi_str)
    
    # 转换为像素
    if unit == 'mm':
        # 毫米转英寸再转像素：mm / 25.4 * dpi
        width_px = int(width / 25.4 * dpi)
        height_px = int(height / 25.4 * dpi)
    else:  # inch
        width_px = int(width * dpi)
        height_px = int(height * dpi)
    
    return (width_px, height_px)


def should_rotate_image(
    image_width: int,
    image_height: int,
    target_width: int,
    target_height: int
) -> bool:
    """
    判断是否需要旋转图片以更好地适配纸张
    
    Args:
        image_width: 图片宽度
        image_height: 图片高度
        target_width: 目标宽度
        target_height: 目标高度
    
    Returns:
        True 表示需要旋转 90 度
    """
    # 判断图片和纸张的方向
    image_is_landscape = image_width > image_height  # 图片是横向
    target_is_landscape = target_width > target_height  # 纸张是横向
    
    # 如果方向不一致，需要旋转
    return image_is_landscape != target_is_landscape


def calculate_scale_ratio(
    image_width: int,
    image_height: int,
    target_width: int,
    target_height: int,
    fit_mode: str = "contain"
) -> Tuple[int, int]:
    """
    计算图片缩放后的尺寸
    
    Args:
        image_width: 原始图片宽度
        image_height: 原始图片高度
        target_width: 目标宽度
        target_height: 目标高度
        fit_mode: 缩放模式
            - "contain": 完整显示图片，可能有留白（默认）
            - "fill": 完整显示内容，不超出纸张边界（推荐用于标签打印）
            - "cover": 填满目标区域，可能裁剪
            - "stretch": 拉伸填充，可能变形
    
    Returns:
        (scaled_width, scaled_height)
    """
    if image_width <= 0 or image_height <= 0:
        return (target_width, target_height)
    
    if fit_mode == "stretch":
        return (target_width, target_height)
    
    width_ratio = target_width / image_width
    height_ratio = target_height / image_height
    
    if fit_mode == "cover":
        # cover 模式：填满目标区域，可能裁剪
        scale_ratio = max(width_ratio, height_ratio)
    else:  # contain 和 fill 都使用 min，确保内容完整显示
        # fill 模式：完整显示内容，不超出纸张边界
        scale_ratio = min(width_ratio, height_ratio)
    
    scaled_width = max(1, int(image_width * scale_ratio))
    scaled_height = max(1, int(image_height * scale_ratio))
    
    return (scaled_width, scaled_height)



def enhance_image_quality(
    image: Image.Image,
    sharpen: bool = True,
    contrast: float = 1.0,
    brightness: float = 1.0
) -> Image.Image:
    """
    增强图片质量以提升打印清晰度
    
    Args:
        image: PIL Image 对象
        sharpen: 是否锐化（提升边缘清晰度）
        contrast: 对比度增强系数（1.0=原始，>1.0=增强，<1.0=降低）
        brightness: 亮度调整系数（1.0=原始，>1.0=增亮，<1.0=变暗）
    
    Returns:
        增强后的图片
    """
    enhanced = image.copy()
    
    # 1. 调整对比度（提升黑白对比）
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = enhancer.enhance(contrast)
    
    # 2. 调整亮度
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(enhanced)
        enhanced = enhancer.enhance(brightness)
    
    # 3. 锐化处理（提升边缘清晰度）
    if sharpen:
        enhanced = enhanced.filter(ImageFilter.SHARPEN)
    
    return enhanced


def convert_to_monochrome_optimized(
    image: Image.Image,
    dither: bool = True,
    threshold: Optional[int] = None
) -> Image.Image:
    """
    优化的黑白转换，提升打印效果
    
    Args:
        image: PIL Image 对象
        dither: 是否使用抖动算法（Floyd-Steinberg）
        threshold: 二值化阈值（0-255），None 表示自动
    
    Returns:
        黑白图片
    """
    # 先转为灰度
    if image.mode != 'L':
        gray = image.convert('L')
    else:
        gray = image.copy()
    
    if threshold is not None:
        # 使用指定阈值进行二值化
        return gray.point(lambda x: 255 if x > threshold else 0, mode='1')
    elif dither:
        # 使用抖动算法（Floyd-Steinberg），效果更好
        return gray.convert('1', dither=Image.Dither.FLOYDSTEINBERG)
    else:
        # 简单二值化
        return gray.convert('1', dither=Image.Dither.NONE)


def optimize_image_for_print(
    image: Image.Image,
    target_dpi: int = 203,
    color_mode: Optional[str] = None,
    enhance_quality: bool = True
) -> Image.Image:
    """
    为打印优化图片
    
    Args:
        image: 原始图片
        target_dpi: 目标 DPI
        color_mode: 颜色模式（monochrome, grayscale, color）
        enhance_quality: 是否增强质量
    
    Returns:
        优化后的图片
    """
    optimized = image.copy()
    
    # 1. 质量增强（在颜色转换之前）
    if enhance_quality:
        # 对于黑白打印，增强对比度
        if color_mode and color_mode.lower() in ["monochrome", "mono", "bw"]:
            optimized = enhance_image_quality(
                optimized,
                sharpen=True,
                contrast=1.2,  # 增强对比度 20%
                brightness=1.0
            )
        else:
            # 彩色或灰度打印，轻微锐化
            optimized = enhance_image_quality(
                optimized,
                sharpen=True,
                contrast=1.1,
                brightness=1.0
            )
    
    # 2. 颜色模式转换
    if color_mode:
        mode_lower = color_mode.lower()
        if mode_lower in ["monochrome", "mono", "bw"]:
            # 使用优化的黑白转换
            optimized = convert_to_monochrome_optimized(
                optimized,
                dither=True  # 使用抖动算法
            )
        elif mode_lower in ["grayscale", "gray"]:
            optimized = optimized.convert("L")
        else:
            optimized = optimized.convert("RGB")
    
    return optimized


def get_optimal_resampling_filter() -> Image.Resampling:
    """
    获取最佳的重采样滤镜
    
    Returns:
        PIL 重采样滤镜
    """
    # LANCZOS 是质量最高的缩放算法
    if hasattr(Image, "Resampling"):
        return Image.Resampling.LANCZOS
    elif hasattr(Image, "LANCZOS"):
        return Image.LANCZOS
    else:  # pragma: no cover
        return Image.ANTIALIAS


# SVG 支持已完全移除以简化依赖和提高兼容性
# 支持的图片格式：PNG, JPG, JPEG, BMP, GIF, TIFF, PDF
