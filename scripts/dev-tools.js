#!/usr/bin/env node

/**
 * 開發者工具
 * 提供開發者友好的構建工具和腳本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevTools {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      tool: '🔧'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async showStatus() {
    this.log('=== 智能衣櫥應用狀態 ===', 'tool');
    
    // Node.js 版本
    this.log(`Node.js: ${process.version}`, 'info');
    
    // npm 版本
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm: ${npmVersion}`, 'info');
    } catch (error) {
      this.log('npm: 未安裝', 'error');
    }

    // 項目結構
    const hasRootPackage = fs.existsSync(path.join(this.rootDir, 'package.json'));
    const hasClientPackage = fs.existsSync(path.join(this.clientDir, 'package.json'));
    const hasRootNodeModules = fs.existsSync(path.join(this.rootDir, 'node_modules'));
    const hasClientNodeModules = fs.existsSync(path.join(this.clientDir, 'node_modules'));
    const hasBuild = fs.existsSync(path.join(this.clientDir, 'build'));

    this.log(`根目錄 package.json: ${hasRootPackage ? '✓' : '✗'}`, hasRootPackage ? 'success' : 'error');
    this.log(`客戶端 package.json: ${hasClientPackage ? '✓' : '✗'}`, hasClientPackage ? 'success' : 'error');
    this.log(`根目錄依賴: ${hasRootNodeModules ? '✓' : '✗'}`, hasRootNodeModules ? 'success' : 'error');
    this.log(`客戶端依賴: ${hasClientNodeModules ? '✓' : '✗'}`, hasClientNodeModules ? 'success' : 'error');
    this.log(`構建輸出: ${hasBuild ? '✓' : '✗'}`, hasBuild ? 'success' : 'warn');

    // 平台檢測
    try {
      const platformOutput = execSync('npm run platform:detect', { encoding: 'utf8', stdio: 'pipe' });
      const platform = platformOutput.match(/Detected platform: (.+)/)?.[1] || 'unknown';
      this.log(`檢測到的平台: ${platform}`, 'info');
    } catch (error) {
      this.log('平台檢測失敗', 'warn');
    }
  }

  async quickFix() {
    this.log('=== 快速修復 ===', 'tool');
    
    const fixes = [
      {
        name: '檢查並修復依賴',
        command: 'npm run fix:deps',
        critical: true
      },
      {
        name: '驗證依賴完整性',
        command: 'npm run verify:deps',
        critical: true
      },
      {
        name: '清理並重新安裝',
        command: 'npm run install:all',
        critical: false
      }
    ];

    for (const fix of fixes) {
      try {
        this.log(`執行: ${fix.name}`, 'tool');
        execSync(fix.command, { cwd: this.rootDir, stdio: 'inherit' });
        this.log(`✓ ${fix.name} 完成`, 'success');
      } catch (error) {
        this.log(`✗ ${fix.name} 失敗: ${error.message}`, 'error');
        if (fix.critical) {
          this.log('關鍵修復失敗，停止執行', 'error');
          return false;
        }
      }
    }

    this.log('快速修復完成', 'success');
    return true;
  }

  async cleanAll() {
    this.log('=== 清理所有構建文件 ===', 'tool');
    
    const itemsToClean = [
      { path: path.join(this.rootDir, 'node_modules'), name: '根目錄 node_modules' },
      { path: path.join(this.clientDir, 'node_modules'), name: '客戶端 node_modules' },
      { path: path.join(this.clientDir, 'build'), name: '構建輸出' },
      { path: path.join(this.rootDir, 'package-lock.json'), name: '根目錄 package-lock.json' },
      { path: path.join(this.clientDir, 'package-lock.json'), name: '客戶端 package-lock.json' },
      { path: path.join(this.rootDir, '.build-backups'), name: '構建備份' },
      { path: path.join(this.rootDir, 'logs'), name: '日誌文件' }
    ];

    for (const item of itemsToClean) {
      if (fs.existsSync(item.path)) {
        try {
          fs.rmSync(item.path, { recursive: true, force: true });
          this.log(`✓ 已清理: ${item.name}`, 'success');
        } catch (error) {
          this.log(`✗ 清理失敗: ${item.name} - ${error.message}`, 'error');
        }
      } else {
        this.log(`- 不存在: ${item.name}`, 'info');
      }
    }

    this.log('清理完成', 'success');
  }

  async freshStart() {
    this.log('=== 全新開始 ===', 'tool');
    
    // 清理所有文件
    await this.cleanAll();
    
    // 重新安裝依賴
    this.log('重新安裝依賴...', 'tool');
    try {
      execSync('npm run install:all', { cwd: this.rootDir, stdio: 'inherit' });
      this.log('✓ 依賴安裝完成', 'success');
    } catch (error) {
      this.log(`✗ 依賴安裝失敗: ${error.message}`, 'error');
      return false;
    }

    // 驗證安裝
    this.log('驗證安裝...', 'tool');
    try {
      execSync('npm run verify:deps', { cwd: this.rootDir, stdio: 'inherit' });
      this.log('✓ 驗證通過', 'success');
    } catch (error) {
      this.log(`✗ 驗證失敗: ${error.message}`, 'error');
      return false;
    }

    this.log('全新開始完成！', 'success');
    return true;
  }

  async runTests() {
    this.log('=== 運行測試套件 ===', 'tool');
    
    const tests = [
      { name: '構建驗證', command: 'npm run validate' },
      { name: '構建測試', command: 'npm run test:build' },
      { name: '集成測試', command: 'npm run test:integration' }
    ];

    const results = [];

    for (const test of tests) {
      this.log(`運行: ${test.name}`, 'tool');
      const startTime = Date.now();
      
      try {
        execSync(test.command, { cwd: this.rootDir, stdio: 'inherit' });
        const duration = Date.now() - startTime;
        results.push({ name: test.name, passed: true, duration });
        this.log(`✓ ${test.name} 通過 (${duration}ms)`, 'success');
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ name: test.name, passed: false, duration });
        this.log(`✗ ${test.name} 失敗 (${duration}ms)`, 'error');
      }
    }

    // 測試結果摘要
    this.log('\n=== 測試結果摘要 ===', 'tool');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    this.log(`通過: ${passed}/${total}`, passed === total ? 'success' : 'warn');
    
    results.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      const type = result.passed ? 'success' : 'error';
      this.log(`${status} ${result.name}: ${result.duration}ms`, type);
    });

    return passed === total;
  }

  async buildAndTest() {
    this.log('=== 構建並測試 ===', 'tool');
    
    // 構建
    this.log('開始構建...', 'tool');
    try {
      execSync('npm run build', { cwd: this.rootDir, stdio: 'inherit' });
      this.log('✓ 構建完成', 'success');
    } catch (error) {
      this.log(`✗ 構建失敗: ${error.message}`, 'error');
      return false;
    }

    // 測試
    this.log('開始測試...', 'tool');
    const testsPassed = await this.runTests();
    
    if (testsPassed) {
      this.log('✓ 構建和測試全部通過！', 'success');
      return true;
    } else {
      this.log('✗ 部分測試失敗', 'error');
      return false;
    }
  }

  async showHelp() {
    console.log(`
🔧 智能衣櫥應用開發者工具

用法: npm run dev:tools <command>

可用命令:
  status      - 顯示項目狀態
  fix         - 快速修復常見問題
  clean       - 清理所有構建文件
  fresh       - 全新開始（清理 + 重新安裝）
  test        - 運行測試套件
  build       - 構建並測試
  help        - 顯示此幫助信息

示例:
  npm run dev:tools status
  npm run dev:tools fix
  npm run dev:tools fresh

其他有用的命令:
  npm run diagnose        - 運行診斷工具
  npm run fix:deps        - 修復依賴問題
  npm run build:monitor   - 監控構建過程
  npm run emergency       - 緊急恢復
    `);
  }

  async run() {
    const command = process.argv[2] || 'help';

    switch (command) {
      case 'status':
        await this.showStatus();
        break;
      
      case 'fix':
        await this.quickFix();
        break;
      
      case 'clean':
        await this.cleanAll();
        break;
      
      case 'fresh':
        await this.freshStart();
        break;
      
      case 'test':
        await this.runTests();
        break;
      
      case 'build':
        await this.buildAndTest();
        break;
      
      case 'help':
      default:
        await this.showHelp();
        break;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tools = new DevTools();
  tools.run().catch(error => {
    console.error('❌ 開發者工具執行失敗:', error);
    process.exit(1);
  });
}

module.exports = DevTools;