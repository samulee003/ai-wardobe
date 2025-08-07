#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class APKBuilder {
  constructor() {
    this.clientDir = path.join(__dirname, '../client');
    this.androidDir = path.join(this.clientDir, 'android');
    this.buildType = process.env.BUILD_TYPE || 'debug';
  }

  log(message) {
    console.log(`[APK Builder] ${message}`);
  }

  error(message) {
    console.error(`[APK Builder ERROR] ${message}`);
  }

  execCommand(command, cwd = process.cwd()) {
    try {
      this.log(`執行: ${command}`);
      return execSync(command, { 
        cwd, 
        stdio: 'inherit',
        encoding: 'utf8'
      });
    } catch (error) {
      this.error(`命令失敗: ${command}`);
      throw error;
    }
  }

  installDependencies() {
    this.log('安裝依賴...');
    this.execCommand('npm install');
    this.execCommand('npm install', this.clientDir);
  }

  buildReactApp() {
    this.log('構建 React 應用...');
    this.execCommand('CI=false npm run build', this.clientDir);
  }

  setupCapacitor() {
    this.log('設置 Capacitor...');
    this.execCommand('node scripts/setup-capacitor.js');
  }

  buildAPK() {
    this.log(`構建 ${this.buildType} APK...`);
    
    const gradlewPath = path.join(this.androidDir, 'gradlew');
    if (!fs.existsSync(gradlewPath)) {
      throw new Error('gradlew 文件不存在');
    }

    // 確保 gradlew 可執行
    this.execCommand(`chmod +x ${gradlewPath}`);
    
    const buildCommand = this.buildType === 'release' ? 'assembleRelease' : 'assembleDebug';
    this.execCommand(`./gradlew ${buildCommand}`, this.androidDir);
  }

  getAPKPath() {
    const apkDir = path.join(this.androidDir, 'app', 'build', 'outputs', 'apk', this.buildType);
    const apkName = this.buildType === 'release' ? 'app-release-unsigned.apk' : 'app-debug.apk';
    return path.join(apkDir, apkName);
  }

  validateAPK() {
    const apkPath = this.getAPKPath();
    
    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK 文件不存在: ${apkPath}`);
    }

    const stats = fs.statSync(apkPath);
    this.log(`APK 大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 驗證 APK 結構
    try {
      this.execCommand(`aapt dump badging ${apkPath}`);
      this.log('APK 驗證成功');
    } catch (error) {
      this.error('APK 驗證失敗');
      throw error;
    }
    
    return apkPath;
  }

  async build() {
    try {
      this.log(`開始構建 ${this.buildType} APK...`);
      
      this.installDependencies();
      this.buildReactApp();
      this.setupCapacitor();
      this.buildAPK();
      
      const apkPath = this.validateAPK();
      
      this.log(`APK 構建完成: ${apkPath}`);
      return apkPath;
      
    } catch (error) {
      this.error(`構建失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const builder = new APKBuilder();
  builder.build();
}

module.exports = APKBuilder;