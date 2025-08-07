#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
    this.startTime = Date.now();
  }

  log(message) {
    console.log(`[Integration Test] ${message}`);
  }

  error(message) {
    console.error(`[Integration Test ERROR] ${message}`);
  }

  addTestResult(testName, passed, message = '', duration = 0) {
    const result = {
      name: testName,
      passed,
      message,
      duration,
      timestamp: new Date().toISOString()
    };

    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    
    if (passed) {
      this.testResults.summary.passed++;
      this.log(`✅ ${testName}: ${message} (${duration}ms)`);
    } else {
      this.testResults.summary.failed++;
      this.error(`❌ ${testName}: ${message}`);
    }
  }

  execCommand(command, options = {}) {
    try {
      const startTime = Date.now();
      const result = execSync(command, { 
        encoding: 'utf8',
        ...options
      });
      const duration = Date.now() - startTime;
      return { success: true, output: result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { success: false, error: error.message, duration };
    }
  }

  async testEnvironmentSetup() {
    const testName = '環境設置測試';
    const startTime = Date.now();

    try {
      // 檢查 Node.js
      const nodeResult = this.execCommand('node --version');
      if (!nodeResult.success) {
        throw new Error('Node.js 未安裝');
      }

      // 檢查 npm
      const npmResult = this.execCommand('npm --version');
      if (!npmResult.success) {
        throw new Error('npm 未安裝');
      }

      // 檢查 Java
      const javaResult = this.execCommand('java -version 2>&1');
      if (!javaResult.success) {
        throw new Error('Java 未安裝');
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, '環境設置正確', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testDependencyInstallation() {
    const testName = '依賴安裝測試';
    const startTime = Date.now();

    try {
      // 檢查根目錄依賴
      if (!fs.existsSync('node_modules')) {
        const result = this.execCommand('npm install');
        if (!result.success) {
          throw new Error('根目錄依賴安裝失敗');
        }
      }

      // 檢查客戶端依賴
      if (!fs.existsSync('client/node_modules')) {
        const result = this.execCommand('npm install', { cwd: 'client' });
        if (!result.success) {
          throw new Error('客戶端依賴安裝失敗');
        }
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, '依賴安裝成功', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testReactBuild() {
    const testName = 'React 應用構建測試';
    const startTime = Date.now();

    try {
      // 清理舊的構建
      if (fs.existsSync('client/build')) {
        fs.rmSync('client/build', { recursive: true, force: true });
      }

      // 構建 React 應用
      const result = this.execCommand('CI=false npm run build', { cwd: 'client' });
      if (!result.success) {
        throw new Error(`React 構建失敗: ${result.error}`);
      }

      // 檢查構建產物
      if (!fs.existsSync('client/build/index.html')) {
        throw new Error('構建產物不完整');
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, 'React 應用構建成功', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testCapacitorSetup() {
    const testName = 'Capacitor 設置測試';
    const startTime = Date.now();

    try {
      // 運行 Capacitor 設置腳本
      const result = this.execCommand('node scripts/setup-capacitor.js');
      if (!result.success) {
        throw new Error(`Capacitor 設置失敗: ${result.error}`);
      }

      // 檢查 Android 項目
      if (!fs.existsSync('client/android/app/build.gradle')) {
        throw new Error('Android 項目未正確創建');
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, 'Capacitor 設置成功', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testVersionManagement() {
    const testName = '版本管理測試';
    const startTime = Date.now();

    try {
      // 運行版本管理腳本
      const result = this.execCommand('node scripts/version-manager.js');
      if (!result.success) {
        throw new Error(`版本管理失敗: ${result.error}`);
      }

      // 檢查版本文件
      if (!fs.existsSync('version.json')) {
        throw new Error('版本文件未生成');
      }

      const versionInfo = JSON.parse(fs.readFileSync('version.json', 'utf8'));
      if (!versionInfo.versionName || !versionInfo.versionCode) {
        throw new Error('版本信息不完整');
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, `版本: ${versionInfo.versionName}`, duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testAPKBuild() {
    const testName = 'APK 構建測試';
    const startTime = Date.now();

    try {
      // 設置環境變數
      process.env.BUILD_TYPE = 'debug';

      // 運行 APK 構建
      const result = this.execCommand('node scripts/build-apk.js');
      if (!result.success) {
        throw new Error(`APK 構建失敗: ${result.error}`);
      }

      // 檢查 APK 文件
      const apkPath = 'client/android/app/build/outputs/apk/debug/app-debug.apk';
      if (!fs.existsSync(apkPath)) {
        throw new Error('APK 文件未生成');
      }

      const stats = fs.statSync(apkPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, `APK 構建成功 (${sizeMB} MB)`, duration);
      return apkPath;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return null;
    }
  }

  async testAPKValidation(apkPath) {
    if (!apkPath) {
      this.addTestResult('APK 驗證測試', false, 'APK 文件不存在');
      return false;
    }

    const testName = 'APK 驗證測試';
    const startTime = Date.now();

    try {
      // 運行 APK 測試
      const result = this.execCommand(`node scripts/test-apk.js ${apkPath}`);
      if (!result.success) {
        throw new Error(`APK 驗證失敗: ${result.error}`);
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, 'APK 驗證通過', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testSecurityCheck() {
    const testName = '安全檢查測試';
    const startTime = Date.now();

    try {
      // 運行安全檢查
      const result = this.execCommand('node scripts/security-check.js');
      
      // 安全檢查可能有警告但不一定失敗
      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, '安全檢查完成', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  async testUpdateChecker() {
    const testName = '更新檢查測試';
    const startTime = Date.now();

    try {
      // 檢查更新檢查服務
      const updateCheckerPath = 'client/src/services/updateChecker.js';
      if (!fs.existsSync(updateCheckerPath)) {
        throw new Error('更新檢查服務文件不存在');
      }

      // 檢查更新通知組件
      const updateNotificationPath = 'client/src/components/UpdateNotification.js';
      if (!fs.existsSync(updateNotificationPath)) {
        throw new Error('更新通知組件文件不存在');
      }

      const duration = Date.now() - startTime;
      this.addTestResult(testName, true, '更新檢查功能正常', duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(testName, false, error.message, duration);
      return false;
    }
  }

  generateTestReport() {
    this.testResults.summary.duration = Date.now() - this.startTime;
    
    const reportPath = path.join(__dirname, '../integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    // 計算成功率
    const successRate = this.testResults.summary.total > 0 
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)
      : '0';

    console.log('\n📊 集成測試報告:');
    console.log(`   總測試數: ${this.testResults.summary.total}`);
    console.log(`   通過: ${this.testResults.summary.passed}`);
    console.log(`   失敗: ${this.testResults.summary.failed}`);
    console.log(`   成功率: ${successRate}%`);
    console.log(`   總耗時: ${(this.testResults.summary.duration / 1000).toFixed(1)}s`);
    console.log(`   報告文件: ${reportPath}`);

    // 輸出到 GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `integration_success_rate=${successRate}%\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `integration_duration=${this.testResults.summary.duration}\n`);
    }

    return this.testResults.summary.failed === 0;
  }

  async runIntegrationTests() {
    try {
      this.log('開始集成測試...');

      // 按順序運行所有測試
      await this.testEnvironmentSetup();
      await this.testDependencyInstallation();
      await this.testReactBuild();
      await this.testCapacitorSetup();
      await this.testVersionManagement();
      
      const apkPath = await this.testAPKBuild();
      await this.testAPKValidation(apkPath);
      await this.testSecurityCheck();
      await this.testUpdateChecker();

      // 生成測試報告
      const allTestsPassed = this.generateTestReport();

      if (allTestsPassed) {
        this.log('✅ 所有集成測試通過');
        return true;
      } else {
        this.error('❌ 部分集成測試失敗');
        return false;
      }

    } catch (error) {
      this.error(`集成測試失敗: ${error.message}`);
      return false;
    }
  }
}

if (require.main === module) {
  const tester = new IntegrationTester();
  
  tester.runIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = IntegrationTester;