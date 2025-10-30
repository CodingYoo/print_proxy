"""
测试打印工具函数
"""
import pytest
from app.utils.print_utils import parse_media_size, calculate_scale_ratio, should_rotate_image


class TestParseMediaSize:
    """测试 media_size 解析功能"""
    
    def test_parse_mm_format(self):
        """测试毫米格式"""
        result = parse_media_size("40x60mm", dpi=203)
        assert result is not None
        width, height = result
        # 40mm / 25.4 * 203 ≈ 319
        # 60mm / 25.4 * 203 ≈ 479
        assert 315 <= width <= 325
        assert 475 <= height <= 485
    
    def test_parse_mm_with_dpi(self):
        """测试带 DPI 的毫米格式"""
        result = parse_media_size("40x60mm@300dpi")
        assert result is not None
        width, height = result
        # 40mm / 25.4 * 300 ≈ 472
        # 60mm / 25.4 * 300 ≈ 709
        assert 470 <= width <= 475
        assert 705 <= height <= 715
    
    def test_parse_inch_format(self):
        """测试英寸格式"""
        result = parse_media_size("2x3inch", dpi=203)
        assert result is not None
        width, height = result
        assert width == 2 * 203
        assert height == 3 * 203
    
    def test_parse_inch_with_dpi(self):
        """测试带 DPI 的英寸格式"""
        result = parse_media_size("2x3inch@300dpi")
        assert result is not None
        width, height = result
        assert width == 2 * 300
        assert height == 3 * 300
    
    def test_parse_with_spaces(self):
        """测试带空格的格式"""
        result = parse_media_size("40 x 60 mm", dpi=203)
        assert result is not None
    
    def test_parse_decimal(self):
        """测试小数格式"""
        result = parse_media_size("40.5x60.5mm", dpi=203)
        assert result is not None
        width, height = result
        assert width > 0
        assert height > 0
    
    def test_parse_none(self):
        """测试 None 输入"""
        result = parse_media_size(None)
        assert result is None
    
    def test_parse_invalid_format(self):
        """测试无效格式"""
        result = parse_media_size("invalid")
        assert result is None
        
        result = parse_media_size("40x60")
        assert result is None
        
        result = parse_media_size("A4")
        assert result is None


class TestShouldRotateImage:
    """测试图片旋转判断"""
    
    def test_landscape_to_portrait(self):
        """横向图片 -> 纵向纸张，需要旋转"""
        assert should_rotate_image(800, 600, 400, 600) is True
    
    def test_portrait_to_landscape(self):
        """纵向图片 -> 横向纸张，需要旋转"""
        assert should_rotate_image(600, 800, 600, 400) is True
    
    def test_landscape_to_landscape(self):
        """横向图片 -> 横向纸张，不需要旋转"""
        assert should_rotate_image(800, 600, 600, 400) is False
    
    def test_portrait_to_portrait(self):
        """纵向图片 -> 纵向纸张，不需要旋转"""
        assert should_rotate_image(600, 800, 400, 600) is False
    
    def test_square_image(self):
        """正方形图片 -> 横向纸张"""
        # 正方形图片 (400x400) vs 横向纸张 (600x400)
        # 图片不是横向，纸张是横向，所以会返回 True
        assert should_rotate_image(400, 400, 600, 400) is True
    
    def test_square_to_square(self):
        """正方形图片 -> 正方形纸张"""
        assert should_rotate_image(400, 400, 400, 400) is False


class TestCalculateScaleRatio:
    """测试缩放比例计算"""
    
    def test_contain_mode_landscape(self):
        """测试 contain 模式 - 横向图片"""
        width, height = calculate_scale_ratio(800, 600, 400, 400, "contain")
        assert width == 400
        assert height == 300
    
    def test_contain_mode_portrait(self):
        """测试 contain 模式 - 纵向图片"""
        width, height = calculate_scale_ratio(600, 800, 400, 400, "contain")
        assert width == 300
        assert height == 400
    
    def test_fill_mode(self):
        """测试 fill 模式 - 填满纸张"""
        width, height = calculate_scale_ratio(800, 600, 400, 400, "fill")
        assert width == 533 or width == 534  # 可能有舍入差异
        assert height == 400
    
    def test_cover_mode(self):
        """测试 cover 模式"""
        width, height = calculate_scale_ratio(800, 600, 400, 400, "cover")
        assert width == 533 or width == 534  # 可能有舍入差异
        assert height == 400
    
    def test_stretch_mode(self):
        """测试 stretch 模式"""
        width, height = calculate_scale_ratio(800, 600, 400, 500, "stretch")
        assert width == 400
        assert height == 500
    
    def test_zero_dimensions(self):
        """测试零尺寸"""
        width, height = calculate_scale_ratio(0, 0, 400, 400, "contain")
        assert width == 400
        assert height == 400
