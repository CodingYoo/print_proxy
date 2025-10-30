#!/bin/bash

###############################################################################
# 前端应用部署脚本
# 用于自动化构建和部署流程
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查必需的工具
check_requirements() {
    print_info "检查必需的工具..."
    
    if ! command_exists node; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm 未安装"
        exit 1
    fi
    
    print_info "✓ 所有必需工具已安装"
}

# 清理旧的构建产物
clean_build() {
    print_info "清理旧的构建产物..."
    npm run clean
    print_info "✓ 清理完成"
}

# 安装依赖
install_dependencies() {
    print_info "安装依赖..."
    npm ci
    print_info "✓ 依赖安装完成"
}

# 运行代码检查
run_lint() {
    print_info "运行代码检查..."
    npm run lint
    print_info "✓ 代码检查通过"
}

# 运行类型检查
run_type_check() {
    print_info "运行类型检查..."
    npm run type-check
    print_info "✓ 类型检查通过"
}

# 构建生产版本
build_production() {
    print_info "构建生产版本..."
    npm run build:prod
    print_info "✓ 构建完成"
}

# 检查构建产物
check_build_output() {
    print_info "检查构建产物..."
    
    if [ ! -d "dist" ]; then
        print_error "构建目录不存在"
        exit 1
    fi
    
    if [ ! -f "dist/index.html" ]; then
        print_error "index.html 不存在"
        exit 1
    fi
    
    # 计算构建产物大小
    BUILD_SIZE=$(du -sh dist | cut -f1)
    print_info "构建产物大小: $BUILD_SIZE"
    
    print_info "✓ 构建产物检查通过"
}

# 创建部署包
create_deployment_package() {
    print_info "创建部署包..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PACKAGE_NAME="frontend-${TIMESTAMP}.tar.gz"
    
    tar -czf "$PACKAGE_NAME" -C dist .
    
    print_info "✓ 部署包已创建: $PACKAGE_NAME"
}

# 主函数
main() {
    print_info "开始部署流程..."
    print_info "================================"
    
    # 检查环境
    check_requirements
    
    # 清理
    clean_build
    
    # 安装依赖
    install_dependencies
    
    # 代码质量检查
    run_lint
    run_type_check
    
    # 构建
    build_production
    
    # 验证构建
    check_build_output
    
    # 创建部署包 (可选)
    # create_deployment_package
    
    print_info "================================"
    print_info "✓ 部署流程完成！"
    print_info "构建产物位于: dist/"
}

# 执行主函数
main "$@"
