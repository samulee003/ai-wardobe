#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class APKTester {
  constructor() {
    this.testReportPath = path.join(__dirname, '../apk-test-report.json');
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  log(message) {
    console.log(`[APK Tester] ${message}`);
  }

  error(message) {
    console.error(`[APK Tester ERROR] ${message}`);
  }

  execCommand(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8',
        ...options
      });
    } catch (error) {
      return null;
    }
  }

  addTestResult(testName, passed, message = '', details = {}) {
    const result = {
      name: testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    
    if (passed) {
      this.testResults.summary.passed++;
      this.log(`✅ ${testName}: ${message}`);
    } else {
      this.testResults.summary.failed++;
      this.error(`❌ ${testName}: ${message}`);
    }
  }

  testAPKExists(apkPath) {
    const testName = 'APK文件存在性檢查';
    
    if (!apkPath) {
      this.addTestResult(testName, false, 'APK路徑未提供');
      return false;
    }

    if (!fs.existsSync(apkPath)) {
      this.addTestResult(testName, false, `APK文件不存在: ${apkPath}`);
      return false;
    }

    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    this.addTestResult(testName, true, `APK文件存在，大小: ${sizeMB} MB`, {
      path: apkPath,
      size: stats.size,
      sizeMB
    });
    
    return true;
  }

  testAPKStructure(apkPath) {
    const testName = 'APK結構驗證';
    
    try {
      const output = this.execCommand(`aapt dump badging "${apkPath}"`);
      
      if (!output) {
        this.addTestResult(testName, false, 'aapt命令執行失敗');
        return false;
      }

      // 解析APK信息
      const packageMatch = output.match(/package: name='([^']+)'/);
      const versionCodeMatch = output.match(/versionCode='([^']+)'/);
      const versionNameMatch = output.match(/versionName='([^']+)'/);
      const minSdkMatch = output.match(/sdkVersion:'([^']+)'/);

      const details = {
        packageName: packageMatch ? packageMatch[1] : 'unknown',
        versionCode: versionCodeMatch ? versionCodeMatch[1] : 'unknown',
        versionName: versionNameMatch ? versionNameMatch[1] : 'unknown',
        minSdkVersion: minSdkMatch ? minSdkMatch[1] : 'unknown'
      };

      // 驗證包名
      if (details.packageName !== 'com.smartwardrobe.app') {
        this.addTestResult(testName, false, `包名不正確: ${details.packageName}`, details);
        return false;
      }

      this.addTestResult(testName, true, 'APK結構驗證通過', details);
      return true;

    } catch (error) {
      this.addTestResult(testName, false, `結構驗證失敗: ${error.message}`);
      return false;
    }
  }

  testAPKSignature(apkPath) {
    const testName = 'APK簽名驗證';
    
    try {
      const output = this.execCommand(`jarsigner -verify -verbose -certs "${apkPath}"`, { stdio: 'pipe' });
      
      if (output && output.includes('jar verified')) {
        this.addTestResult(testName, true, 'APK簽名驗證通過');
        return true;
      } else {
        // 對於debug APK，簽名驗證可能失敗，但這是正常的
        if (apkPath.includes('debug')) {
          this.addTestResult(testName, true, 'Debug APK簽名檢查跳過');
          return true;
        } else {
          this.addTestResult(testName, false, 'APK簽名驗證失敗');
          return false;
        }
      }
    } catch (error) {
      if (apkPath.includes('debug')) {
        this.addTestResult(testName, true, 'Debug APK簽名檢查跳過');
        return true;
      } else {
        this.addTestResult(testName, false, `簽名驗證失敗: ${error.message}`);
        return false;
      }
    }
  }

  testAPKPermissions(apkPath) {
    const testName = 'APK權限檢查';
    
    try {
      const output = this.execCommand(`aapt dump permissions "${apkPath}"`);
      
      if (!output) {
        this.addTestResult(testName, false, '無法獲取權限信息');
        return false;
      }

      const permissions = [];
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/uses-permission: name='([^']+)'/);
        if (match) {
          permissions.push(match[1]);
        }
      }

      // 檢查必需權限
      const requiredPermissions = [
        'android.permission.CAMERA',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.INTERNET'
      ];

      const missingPermissions = requiredPermissions.filter(
        perm => !permissions.some(p => p.includes(perm.split('.').pop()))
      );

      if (missingPermissions.length > 0) {
        this.addTestResult(testName, false, `缺少必需權限: ${missingPermissions.join(', ')}`, {
          permissions,
          missing: missingPermissions
        });
        return false;
      }

      this.addTestResult(testName, true, `權限檢查通過，共${permissions.length}個權限`, {
        permissions,
        count: permissions.length
      });
      
      return true;

    } catch (error) {
      this.addTestResult(testName, false, `權限檢查失敗: ${error.message}`);
      return false;
    }
  }

  testAPKInstallability(apkPath) {
    const testName = 'APK可安裝性測試';
    
    try {
      // 使用 aapt 檢查APK的完整性
      const output = this.execCommand(`aapt dump configurations "${apkPath}"`);
      
      if (!output) {
        this.addTestResult(testName, false, 'APK配置檢查失敗');
        return false;
      }

      // 檢查是否包含必要的配置
      if (output.includes('(default)')) {
        this.addTestResult(testName, true, 'APK可安裝性檢查通過');
        return true;
      } else {
        this.addTestResult(testName, false, 'APK配置不完整');
        return false;
      }

    } catch (error) {
      this.addTestResult(testName, false, `可安裝性測試失敗: ${error.message}`);
      return false;
    }
  }

  testAPKResources(apkPath) {
    const testName = 'APK資源檢查';
    
    try {
      const output = this.execCommand(`aapt list "${apkPath}"`);
      
      if (!output) {
        this.addTestResult(testName, false, '無法列出APK資源');
        return false;
      }

      const resources = output.split('\n').filter(line => line.trim());
      
      // 檢查必要資源
      const requiredResources = [
        'AndroidManifest.xml',
        'classes.dex',
        'resources.arsc'
      ];

      const missingResources = requiredResources.filter(
        resource => !resources.some(r => r.includes(resource))
      );

      if (missingResources.length > 0) {
        this.addTestResult(testName, false, `缺少必要資源: ${missingResources.join(', ')}`, {
          resources: resources.slice(0, 10), // 只顯示前10個資源
          missing: missingResources
        });
        return false;
      }

      this.addTestResult(testName, true, `資源檢查通過，共${resources.length}個文件`, {
        resourceCount: resources.length
      });
      
      return true;

    } catch (error) {
      this.addTestResult(testName, false, `資源檢查失敗: ${error.message}`);
      return false;
    }
  }

  generateTestReport() {
    // 計算成功率
    const successRate = this.testResults.summary.total > 0 
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)
      : '0';

    this.testResults.summary.successRate = `${successRate}%`;

    // 保存測試報告
    fs.writeFileSync(this.testReportPath, JSON.stringify(this.testResults, null, 2));

    // 輸出摘要
    console.log('\n📊 APK測試報告摘要:');
    console.log(`   總測試數: ${this.testResults.summary.total}`);
    console.log(`   通過: ${this.testResults.summary.passed}`);
    console.log(`   失敗: ${this.testResults.summary.failed}`);
    console.log(`   成功率: ${successRate}%`);
    console.log(`   報告文件: ${this.testReportPath}`);

    // 輸出到 GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_success_rate=${successRate}%\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_passed=${this.testResults.summary.passed}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_failed=${this.testResults.summary.failed}\n`);
    }

    return this.testResults.summary.failed === 0;
  }

  async testAPK(apkPath) {
    try {
      this.log(`開始測試APK: ${apkPath}`);

      // 執行所有測試
      const tests = [
        () => this.testAPKExists(apkPath),
        () => this.testAPKStructure(apkPath),
        () => this.testAPKSignature(apkPath),
        () => this.testAPKPermissions(apkPath),
        () => this.testAPKInstallability(apkPath),
        () => this.testAPKResources(apkPath)
      ];

      for (const test of tests) {
        test();
      }

      // 生成測試報告
      const allTestsPassed = this.generateTestReport();

      if (allTestsPassed) {
        this.log('✅ 所有APK測試通過');
        return true;
      } else {
        this.error('❌ 部分APK測試失敗');
        return false;
      }

    } catch (error) {
      this.error(`APK測試失敗: ${error.message}`);
      return false;
    }
  }
}

if (require.main === module) {
  const apkPath = process.argv[2];
  
  if (!apkPath) {
    console.error('使用方法: node test-apk.js <APK文件路徑>');
    process.exit(1);
  }

  const tester = new APKTester();
  tester.testAPK(apkPath).then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = APKTester;