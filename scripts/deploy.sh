#!/bin/bash

# 智能衣櫃APP部署腳本
set -e

echo "🚀 開始部署智能衣櫃管理APP..."

# 檢查必需的環境變數
check_env_vars() {
    echo "📋 檢查環境變數..."
    
    required_vars=("JWT_SECRET" "GEMINI_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ 缺少必需的環境變數: ${missing_vars[*]}"
        echo "請在 .env 文件中設置這些變數"
        exit 1
    fi
    
    echo "✅ 環境變數檢查完成"
}

# 檢查 Docker 和 Docker Compose
check_docker() {
    echo "🐳 檢查 Docker 環境..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker 服務未運行，請啟動 Docker"
        exit 1
    fi
    
    echo "✅ Docker 環境檢查完成"
}

# 創建必要的目錄
create_directories() {
    echo "📁 創建必要的目錄..."
    
    directories=(
        "uploads"
        "logs"
        "nginx/ssl"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        echo "  ✓ 創建目錄: $dir"
    done
    
    echo "✅ 目錄創建完成"
}

# 構建和啟動服務
deploy_services() {
    echo "🔨 構建和部署服務..."
    
    # 停止現有服務
    echo "  停止現有服務..."
    docker compose -f infra/docker/docker-compose.yml down --remove-orphans
    
    # 構建鏡像
    echo "  構建 Docker 鏡像..."
    docker compose -f infra/docker/docker-compose.yml build --no-cache
    
    # 啟動服務
    echo "  啟動服務..."
    docker compose -f infra/docker/docker-compose.yml up -d
    
    echo "✅ 服務部署完成"
}

# 等待服務啟動
wait_for_services() {
    echo "⏳ 等待服務啟動..."
    
    services=("mongodb:27017" "redis:6379" "api:5000")
    
    for service in "${services[@]}"; do
        echo "  等待 $service..."
        timeout 60 bash -c "until docker compose -f infra/docker/docker-compose.yml exec -T ${service%:*} echo 'ready'; do sleep 2; done" || {
            echo "❌ 服務 $service 啟動超時"
            exit 1
        }
        echo "  ✓ $service 已就緒"
    done
    
    echo "✅ 所有服務已啟動"
}

# 運行健康檢查
health_check() {
    echo "🏥 運行健康檢查..."
    
    # 檢查 API 健康狀態
    if curl -f http://localhost:5000/health &> /dev/null; then
        echo "  ✓ API 服務健康"
    else
        echo "  ❌ API 服務不健康"
        return 1
    fi
    
    # 檢查前端
    if curl -f http://localhost:3000 &> /dev/null; then
        echo "  ✓ 前端服務健康"
    else
        echo "  ❌ 前端服務不健康"
        return 1
    fi
    
    # 檢查 Nginx
    if curl -f http://localhost/health &> /dev/null; then
        echo "  ✓ Nginx 服務健康"
    else
        echo "  ❌ Nginx 服務不健康"
        return 1
    fi
    
    echo "✅ 健康檢查通過"
}

# 顯示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "📱 應用訪問地址:"
    echo "  主應用: http://localhost"
    echo "  API文檔: http://localhost/api"
    echo "  監控面板: http://localhost:3001 (admin/admin123)"
    echo "  Prometheus: http://localhost:9090"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看日誌: docker compose -f infra/docker/docker-compose.yml logs -f"
    echo "  停止服務: docker compose -f infra/docker/docker-compose.yml down"
    echo "  重啟服務: docker compose -f infra/docker/docker-compose.yml restart"
    echo "  查看狀態: docker compose -f infra/docker/docker-compose.yml ps"
    echo ""
    echo "📊 監控信息:"
    echo "  Grafana 用戶名: admin"
    echo "  Grafana 密碼: admin123"
    echo ""
}

# 主函數
main() {
    echo "智能衣櫃管理APP - 自動部署腳本"
    echo "=================================="
    
    # 載入環境變數
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        echo "✅ 已載入 .env 文件"
    else
        echo "⚠️  未找到 .env 文件，使用默認配置"
    fi
    
    check_env_vars
    check_docker
    create_directories
    deploy_services
    wait_for_services
    
    if health_check; then
        show_deployment_info
    else
        echo "❌ 部署失敗，請檢查日誌: docker compose -f infra/docker/docker-compose.yml logs"
        exit 1
    fi
}

# 錯誤處理
trap 'echo "❌ 部署過程中發生錯誤"; exit 1' ERR

# 執行主函數
main "$@"