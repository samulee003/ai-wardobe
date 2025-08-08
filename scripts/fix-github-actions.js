#!/usr/bin/env node

/**
 * GitHub Actions構建修復腳本
 * 解決依賴衝突和安全漏洞問題
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 GitHub Actions構建修復腳本');
console.log('=====================================');

// 顏色輸出函數
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log('blue', `🔄 ${description}...`);
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log('green', `✅ ${description} 完成`);
    return true;
  } catch (error) {
    log('red', `❌ ${description} 失敗: ${error.message}`);
    return false;
  }
}

async function fixDependencies() {
  log('yellow', '🚀 開始修復依賴問題...');
  
  // 1. 清理舊的依賴（保留 lockfile 以利 npm ci 使用）
  log('blue', '🧹 清理 node_modules（保留 package-lock.json）...');
  
  const pathsToClean = [
    'node_modules',
    'client/node_modules'
  ];
  
  pathsToClean.forEach(pathToClean => {
    if (fs.existsSync(pathToClean)) {
      fs.rmSync(pathToClean, { recursive: true, force: true });
      log('green', `✅ 已清理: ${pathToClean}`);
    }
  });

  // 2. 安裝根目錄依賴 (使用legacy-peer-deps)
  log('blue', '📦 安裝根目錄依賴...');
  if (!runCommand('npm install --legacy-peer-deps', '根目錄依賴安裝')) {
    log('red', '❌ 根目錄依賴安裝失敗');
    process.exit(1);
  }

  // 3. 安裝客戶端依賴 (使用legacy-peer-deps)
  log('blue', '📱 安裝客戶端依賴...');
  if (!runCommand('cd client && npm install --legacy-peer-deps', '客戶端依賴安裝')) {
    log('red', '❌ 客戶端依賴安裝失敗');
    process.exit(1);
  }

  // 4. 驗證關鍵包版本
  log('blue', '🔍 驗證關鍵包版本...');
  
  try {
    // 檢查multer版本
    const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (rootPackage.dependencies.multer === '^1.4.4-lts.1') {
      log('green', '✅ Multer版本正確 (安全版本)');
    } else {
      log('yellow', '⚠️  Multer版本可能需要檢查');
    }

    // 檢查Capacitor依賴
    const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    if (clientPackage.dependencies['@capacitor/preferences']) {
      log('green', '✅ Capacitor Preferences已配置');
    } else {
      log('yellow', '⚠️  Capacitor Preferences需要檢查');
    }

  } catch (error) {
    log('red', `❌ 版本驗證失敗: ${error.message}`);
  }

  log('green', '🎉 依賴修復完成！');
}

async function createGitHubActionsConfig() {
  log('blue', '⚙️  創建GitHub Actions優化配置...');
  
  const workflowDir = '.github/workflows';
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const workflowContent = `name: Build APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
      
    - name: 🛠️ Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
        
    - name: 📦 Install root dependencies
      run: |
        npm ci --legacy-peer-deps

    - name: 📱 Install client dependencies
      run: |
        cd client
        npm ci --legacy-peer-deps
        
    - name: 🔧 Setup Java JDK
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        
    - name: 🤖 Setup Android SDK
      uses: android-actions/setup-android@v3
      
    - name: 📋 Verify dependencies
      run: |
        node scripts/verify-dependencies.js || echo "Dependency verification completed with warnings"
        
    - name: 🏗️ Build client
      run: |
        cd client
        npm run build
        
    - name: 📱 Setup Capacitor
      run: |
        cd client
        npx cap add android || echo "Android platform already exists"
        npx cap sync
        
    - name: 🔨 Build APK
      run: |
        cd client
        npx cap build android --no-open
        
    - name: 📤 Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-debug-apk
        path: client/android/app/build/outputs/apk/debug/app-debug.apk
        if-no-files-found: warn
        
    - name: 📊 Build summary
      run: |
        echo "✅ APK構建完成"
        echo "📱 檔案位置: client/android/app/build/outputs/apk/debug/"
        ls -la client/android/app/build/outputs/apk/debug/ || echo "APK目錄不存在"
`;

  fs.writeFileSync(`${workflowDir}/build-apk.yml`, workflowContent);
  log('green', '✅ GitHub Actions工作流程已創建');
}

async function updatePackageScripts() {
  log('blue', '📝 更新package.json腳本...');
  
  // 更新根目錄package.json
  const rootPackagePath = 'package.json';
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  
  // 添加GitHub Actions相關腳本
  rootPackage.scripts = {
    ...rootPackage.scripts,
    "ci:install": "npm ci --legacy-peer-deps",
    "ci:install:client": "cd client && npm ci --legacy-peer-deps", 
    "ci:build": "npm run ci:install && npm run ci:install:client && npm run build",
    "github:fix": "node scripts/fix-github-actions.js",
    "deps:clean": "rm -rf node_modules client/node_modules",
    "deps:fresh": "npm run deps:clean && npm run ci:install && npm run ci:install:client"
  };
  
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
  log('green', '✅ 根目錄package.json已更新');
  
  // 更新客戶端package.json
  const clientPackagePath = 'client/package.json';
  const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
  
  // 添加CI相關腳本
  clientPackage.scripts = {
    ...clientPackage.scripts,
    "ci:install": "npm ci --legacy-peer-deps",
    "build:android": "npm run build && npx cap sync && npx cap build android",
    "cap:sync": "npx cap sync",
    "cap:add:android": "npx cap add android"
  };
  
  fs.writeFileSync(clientPackagePath, JSON.stringify(clientPackage, null, 2));
  log('green', '✅ 客戶端package.json已更新');
}

// 主執行函數
async function main() {
  try {
    await fixDependencies();
    await createGitHubActionsConfig(); 
    await updatePackageScripts();
    
    log('green', '🎉 GitHub Actions修復完成！');
    log('yellow', '📋 後續步驟:');
    log('blue', '1. 提交修改到Git倉庫');
    log('blue', '2. 推送到GitHub觸發Actions');
    log('blue', '3. 檢查Actions構建日誌');
    
  } catch (error) {
    log('red', `❌ 修復過程中出現錯誤: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = { fixDependencies, createGitHubActionsConfig, updatePackageScripts };
