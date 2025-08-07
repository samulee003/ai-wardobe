#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class APKErrorDiagnostics {
  constructor() {
    this.clientDir = path.join(__dirname, '../client');
    this.androidDir = path.join(this.clientDir, 'android');
    this.logFile = path.join(__dirname, '../apk-build-diagnostics.log');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // 寫入日誌文件
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warn(message) {
    this.log(message, 'WARN');
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

  checkNodeEnvironment() {
    this.log('檢查 Node.js 環境...');
    
    const issues = [];
    
    try {
      const nodeVersion = this.execCommand('node --version');
      const npmVersion = this.execCommand('npm --version');
      
      this.log(`Node.js 版本: ${nodeVersion?.trim()}`);
      this.log(`npm 版本: ${npmVersion?.trim()}`);
      
      // 檢查 Node.js 版本
      const nodeVersionNum = parseFloat(nodeVersion?.replace('v', ''));
      if (nodeVersionNum < 16) {
        issues.push('Node.js 版本過低，建議使用 16.0 或更高版本');
      }
      
    } catch (error) {
      issues.push('無法檢測 Node.js 環境');
    }
    
    return issues;
  }

  checkJavaEnvironment() {
    this.log('檢查 Java 環境...');
    
    const issues = [];
    
    try {
      const javaVersion = this.execCommand('java -version 2>&1');
      this.log(`Java 版本: ${javaVersion?.split('\n')[0]}`);
      
      if (!javaVersion?.includes('17') && !javaVersion?.includes('11')) {
        issues.push('建議使用 Java 11 或 17');
      }
      
    } catch (error) {
      issues.push('Java 未安裝或未配置到 PATH');
    }
    
    return issues;
  }

  checkAndroidSDK() {
    this.log('檢查 Android SDK...');
    
    const issues = [];
    const androidHome = process.env.ANDROID_HOME;
    
    if (!androidHome) {
      issues.push('ANDROID_HOME 環境變數未設置');
      return issues;
    }
    
    this.log(`ANDROID_HOME: ${androidHome}`);
    
    // 檢查必需的 SDK 組件
    const requiredComponents = [
      'platform-tools',
      'platforms/android-33',
      'build-tools'
    ];
    
    for (const component of requiredComponents) {
      const componentPath = path.join(androidHome, component);
      if (!fs.existsSync(componentPath)) {
        issues.push(`缺少 Android SDK 組件: ${component}`);
      }
    }
    
    return issues;
  }

  checkCapacitorSetup() {
    this.log('檢查 Capacitor 設置...');
    
    const issues = [];
    
    // 檢查 capacitor.config.ts
    const capacitorConfig = path.join(this.clientDir, 'capacitor.config.ts');
    if (!fs.existsSync(capacitorConfig)) {
      issues.push('capacitor.config.ts 文件不存在');
    }
    
    // 檢查 Android 項目
    if (!fs.existsSync(this.androidDir)) {
      issues.push('Android 項目未初始化');
    } else {
      // 檢查關鍵 Android 文件
      const androidFiles = [
        'app/build.gradle',
        'build.gradle',
        'gradle/wrapper/gradle-wrapper.properties'
      ];
      
      for (const file of androidFiles) {
        const filePath = path.join(this.androidDir, file);
        if (!fs.existsSync(filePath)) {
          issues.push(`Android 項目文件缺失: ${file}`);
        }
      }
    }
    
    return issues;
  }

  checkDependencies() {
    this.log('檢查項目依賴...');
    
    const issues = [];
    
    // 檢查根目錄 node_modules
    if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
      issues.push('根目錄依賴未安裝，請運行 npm install');
    }
    
    // 檢查客戶端 node_modules
    if (!fs.existsSync(path.join(this.clientDir, 'node_modules'))) {
      issues.push('客戶端依賴未安裝，請在 client 目錄運行 npm install');
    }
    
    // 檢查關鍵依賴
    const packageJsonPath = path.join(this.clientDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredDeps = ['@capacitor/core', '@capacitor/android', '@capacitor/cli'];
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
          issues.push(`缺少必需依賴: ${dep}`);
        }
      }
    }
    
    return issues;
  }

  checkBuildFiles() {
    this.log('檢查構建文件...');
    
    const issues = [];
    
    // 檢查 React 構建
    const buildDir = path.join(this.clientDir, 'build');
    if (!fs.existsSync(buildDir)) {
      issues.push('React 應用未構建，請運行 npm run build');
    } else {
      const indexHtml = path.join(buildDir, 'index.html');
      if (!fs.existsSync(indexHtml)) {
        issues.push('React 構建不完整，缺少 index.html');
      }
    }
    
    return issues;
  }

  checkGitHubSecrets() {
    this.log('檢查 GitHub Secrets 配置...');
    
    const issues = [];
    const requiredSecrets = [
      'ANDROID_KEYSTORE_BASE64',
      'ANDROID_KEYSTORE_PASSWORD',
      'ANDROID_KEY_ALIAS',
      'ANDROID_KEY_PASSWORD'
    ];
    
    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        issues.push(`GitHub Secret 未設置: ${secret}`);
      }
    }
    
    return issues;
  }

  generateFixSuggestions(allIssues) {
    const suggestions = [];
    
    for (const issue of allIssues) {
      if (issue.includes('Node.js 版本過低')) {
        suggestions.push('更新 Node.js: https://nodejs.org/');
      } else if (issue.includes('Java 未安裝')) {
        suggestions.push('安裝 Java 17: https://adoptium.net/');
      } else if (issue.includes('ANDROID_HOME')) {
        suggestions.push('設置 ANDROID_HOME 環境變數指向 Android SDK 目錄');
      } else if (issue.includes('Android SDK 組件')) {
        suggestions.push('使用 Android Studio SDK Manager 安裝缺失組件');
      } else if (issue.includes('capacitor.config.ts')) {
        suggestions.push('運行: npx cap init');
      } else if (issue.includes('Android 項目未初始化')) {
        suggestions.push('運行: npx cap add android');
      } else if (issue.includes('依賴未安裝')) {
        suggestions.push('運行: npm install && cd client && npm install');
      } else if (issue.includes('React 應用未構建')) {
        suggestions.push('運行: cd client && npm run build');
      } else if (issue.includes('GitHub Secret')) {
        suggestions.push('在 GitHub 倉庫設置中配置 Secrets');
      }
    }
    
    return [...new Set(suggestions)]; // 去重
  }

  async diagnose() {
    try {
      this.log('開始 APK 構建診斷...');
      
      const allIssues = [
        ...this.checkNodeEnvironment(),
        ...this.checkJavaEnvironment(),
        ...this.checkAndroidSDK(),
        ...this.checkCapacitorSetup(),
        ...this.checkDependencies(),
        ...this.checkBuildFiles(),
        ...this.checkGitHubSecrets()
      ];
      
      const report = {
        timestamp: new Date().toISOString(),
        totalIssues: allIssues.length,
        issues: allIssues,
        suggestions: this.generateFixSuggestions(allIssues),
        status: allIssues.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND'
      };
      
      // 保存診斷報告
      const reportPath = path.join(__dirname, '../apk-diagnostics-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      // 輸出結果
      if (allIssues.length === 0) {
        this.log('✅ 診斷完成，未發現問題');
      } else {
        this.error(`❌ 發現 ${allIssues.length} 個問題:`);
        allIssues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
        
        console.log('\n🔧 修復建議:');
        report.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
      
      this.log(`診斷報告已保存: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      this.error(`診斷失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const diagnostics = new APKErrorDiagnostics();
  diagnostics.diagnose();
}

module.exports = APKErrorDiagnostics;