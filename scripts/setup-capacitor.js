#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CapacitorSetup {
  constructor() {
    this.clientDir = path.join(__dirname, '../client');
    this.androidDir = path.join(this.clientDir, 'android');
  }

  log(message) {
    console.log(`[Capacitor Setup] ${message}`);
  }

  error(message) {
    console.error(`[Capacitor Setup ERROR] ${message}`);
  }

  execCommand(command, cwd = this.clientDir) {
    try {
      this.log(`執行命令: ${command}`);
      const result = execSync(command, { 
        cwd, 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      return result;
    } catch (error) {
      this.error(`命令執行失敗: ${command}`);
      throw error;
    }
  }

  checkCapacitorInstalled() {
    try {
      execSync('npx cap --version', { cwd: this.clientDir, stdio: 'pipe' });
      this.log('Capacitor CLI 已安裝');
      return true;
    } catch (error) {
      this.log('Capacitor CLI 未安裝，正在安裝...');
      return false;
    }
  }

  installCapacitor() {
    if (!this.checkCapacitorInstalled()) {
      this.execCommand('npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/storage');
    }
  }

  initializeCapacitor() {
    const capacitorConfigPath = path.join(this.clientDir, 'capacitor.config.ts');
    
    if (!fs.existsSync(capacitorConfigPath)) {
      this.log('初始化 Capacitor 項目...');
      this.execCommand('npx cap init');
    } else {
      this.log('Capacitor 配置文件已存在');
    }
  }

  addAndroidPlatform() {
    if (!fs.existsSync(this.androidDir)) {
      this.log('添加 Android 平台...');
      this.execCommand('npx cap add android');
    } else {
      this.log('Android 平台已存在');
    }
  }

  syncProject() {
    this.log('同步項目到 Android...');
    this.execCommand('npx cap sync android');
  }

  validateSetup() {
    const requiredFiles = [
      'capacitor.config.ts',
      'android/app/src/main/AndroidManifest.xml',
      'android/app/build.gradle',
      'android/build.gradle'
    ];

    let isValid = true;
    for (const file of requiredFiles) {
      const filePath = path.join(this.clientDir, file);
      if (!fs.existsSync(filePath)) {
        this.error(`必需文件不存在: ${file}`);
        isValid = false;
      }
    }

    if (isValid) {
      this.log('Capacitor 設置驗證成功！');
    } else {
      throw new Error('Capacitor 設置驗證失敗');
    }
  }

  async setup() {
    try {
      this.log('開始 Capacitor 設置...');
      
      // 1. 安裝 Capacitor
      this.installCapacitor();
      
      // 2. 初始化 Capacitor
      this.initializeCapacitor();
      
      // 3. 添加 Android 平台
      this.addAndroidPlatform();
      
      // 4. 同步項目
      this.syncProject();
      
      // 5. 驗證設置
      this.validateSetup();
      
      this.log('Capacitor 設置完成！');
      
    } catch (error) {
      this.error(`設置失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  const setup = new CapacitorSetup();
  setup.setup();
}

module.exports = CapacitorSetup;