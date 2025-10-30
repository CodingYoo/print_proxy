"""
SVG打印功能测试
"""
import pytest
import base64
from unittest.mock import patch, MagicMock
from app.utils.print_utils import convert_svg_to_png, process_svg_for_print
from app.services.job_service import SVG_FILE_TYPES, _prepare_print_payload
from app.models.print_job import PrintJob


# 简单的SVG测试内容
SIMPLE_SVG = '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="red"/>
  <text x="50" y="50" text-anchor="middle" font-size="12" fill="white">TEST</text>
</svg>'''


class TestSVGSupport:
    """SVG支持功能测试"""
    
    def test_svg_file_type_recognition(self):
        """测试SVG文件类型识别"""
        assert "svg" in SVG_FILE_TYPES
        
    @patch('app.utils.print_utils.cairosvg')
    def test_convert_svg_to_png_success(self, mock_cairosvg):
        """测试SVG转PNG成功情况"""
        # 模拟cairosvg.svg2png返回PNG字节
        mock_png_bytes = b'\x89PNG\r\n\x1a\n...'  # 模拟PNG文件头
        mock_cairosvg.svg2png.return_value = mock_png_bytes
        
        svg_bytes = SIMPLE_SVG.encode('utf-8')
        result = convert_svg_to_png(svg_bytes, dpi=203)
        
        assert result == mock_png_bytes
        mock_cairosvg.svg2png.assert_called_once()
        
    def test_convert_svg_to_png_no_cairosvg(self):
        """测试缺少cairosvg库的情况"""
        with patch('app.utils.print_utils.cairosvg', None):
            svg_bytes = SIMPLE_SVG.encode('utf-8')
            
            with pytest.raises(RuntimeError, match="缺少 cairosvg 库"):
                convert_svg_to_png(svg_bytes)
    
    @patch('app.utils.print_utils.cairosvg')
    def test_convert_svg_to_png_with_dimensions(self, mock_cairosvg):
        """测试指定尺寸的SVG转换"""
        mock_png_bytes = b'\x89PNG\r\n\x1a\n...'
        mock_cairosvg.svg2png.return_value = mock_png_bytes
        
        svg_bytes = SIMPLE_SVG.encode('utf-8')
        result = convert_svg_to_png(svg_bytes, target_width=200, target_height=300, dpi=300)
        
        assert result == mock_png_bytes
        # 验证调用参数
        call_args = mock_cairosvg.svg2png.call_args[1]
        assert call_args['output_width'] == 200
        assert call_args['output_height'] == 300
        assert call_args['dpi'] == 300
    
    @patch('app.utils.print_utils.convert_svg_to_png')
    @patch('app.utils.print_utils.parse_media_size')
    def test_process_svg_for_print_no_media_size(self, mock_parse_media_size, mock_convert):
        """测试无指定尺寸的SVG处理"""
        mock_parse_media_size.return_value = None
        mock_png_bytes = b'mock_png_data'
        mock_convert.return_value = mock_png_bytes
        
        svg_bytes = SIMPLE_SVG.encode('utf-8')
        result = process_svg_for_print(svg_bytes, dpi=203)
        
        assert result == mock_png_bytes
        mock_convert.assert_called_once_with(svg_bytes, dpi=203)
    
    @patch('app.utils.print_utils.convert_svg_to_png')
    @patch('app.utils.print_utils.parse_media_size')
    def test_process_svg_for_print_with_media_size(self, mock_parse_media_size, mock_convert):
        """测试指定尺寸的SVG处理"""
        mock_parse_media_size.return_value = (400, 600)  # 40x60mm @ 203dpi
        mock_png_bytes = b'mock_png_data'
        mock_convert.return_value = mock_png_bytes
        
        svg_bytes = SIMPLE_SVG.encode('utf-8')
        result = process_svg_for_print(
            svg_bytes, 
            media_size="40x60mm@203dpi",
            fit_mode="stretch"
        )
        
        assert result == mock_png_bytes
        # 验证stretch模式直接使用目标尺寸
        mock_convert.assert_called_once_with(
            svg_bytes, 
            target_width=400, 
            target_height=600, 
            dpi=203
        )
    
    def test_prepare_print_payload_svg(self):
        """测试SVG打印载荷准备"""
        # 创建模拟的PrintJob对象
        job = MagicMock(spec=PrintJob)
        job.file_type = "svg"
        job.content = SIMPLE_SVG.encode('utf-8')
        
        mode, payload = _prepare_print_payload(job)
        
        assert mode == "svg"
        assert payload == job.content
    
    def test_svg_in_allowed_file_types(self):
        """测试SVG在允许的文件类型中"""
        from app.schemas.print_job import ALLOWED_FILE_TYPES
        assert "svg" in ALLOWED_FILE_TYPES


class TestSVGIntegration:
    """SVG集成测试"""
    
    @patch('app.services.job_service.process_svg_for_print')
    @patch('app.services.job_service._print_image_with_gdi')
    def test_svg_print_integration(self, mock_print_gdi, mock_process_svg):
        """测试SVG打印集成流程"""
        from app.services.job_service import _send_to_printer
        
        # 模拟SVG处理返回PNG数据
        mock_png_data = b'processed_png_data'
        mock_process_svg.return_value = mock_png_data
        
        # 创建模拟的PrintJob
        job = MagicMock(spec=PrintJob)
        job.file_type = "svg"
        job.content = SIMPLE_SVG.encode('utf-8')
        job.copies = 1
        job.title = "Test SVG Job"
        job.media_size = "40x60mm@203dpi"
        job.color_mode = "color"
        job.fit_mode = "fill"
        job.auto_rotate = 1
        job.enhance_quality = 1
        job.printer = None
        
        # 模拟打印机
        with patch('app.services.job_service.win32print') as mock_win32print:
            mock_win32print.GetDefaultPrinter.return_value = "Test Printer"
            
            # 模拟_prepare_print_payload返回SVG模式
            with patch('app.services.job_service._prepare_print_payload') as mock_prepare:
                mock_prepare.return_value = ("svg", job.content)
                
                # 执行打印
                _send_to_printer(job)
                
                # 验证SVG处理被调用
                mock_process_svg.assert_called_once_with(
                    job.content,
                    media_size=job.media_size,
                    dpi=203,
                    fit_mode="fill",
                    color_mode=job.color_mode,
                    enhance_quality=True
                )
                
                # 验证GDI打印被调用
                mock_print_gdi.assert_called_once_with(
                    mock_png_data,
                    "Test Printer",
                    1,
                    "Test SVG Job",
                    media_size=job.media_size,
                    color_mode=job.color_mode,
                    fit_mode="fill",
                    auto_rotate=True,
                    enhance_quality=False  # SVG处理时已应用
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
