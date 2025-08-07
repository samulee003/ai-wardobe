#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AndroidSDKSetup {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.androidHome = process.env.ANDROID_HOME || path.join(os.homedir(), 'Android', 'Sdk');
  }

  log(message) {
    console.log(`[Android SDK] ${message}`);
  }

  error(message) {
    console.error(`[Android SDK ERROR] ${message}`);
  }

  execCommand(command, options = {}) {
    try {
      this.log(`執行: ${command}`);
      return execSync(command, { 
        stdio: 'inherit',
        encoding: 'utf8',
        ...options
      });
    } catch (error) {
      this.error(`命令失敗: ${command}`);
      throw error;
    }
  }

  checkSDKInstalled() {
    try {
      const sdkManager = path.join(this.androidHome, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
      if (fs.existsSync(sdkManager)) {
        this.log('Android SDK 已安裝');
        return true;
      }
    } catch (error) {
      // SDK not found
    }
    return false;
  }

  setupEnvironment() {
    this.log('設置環境變數...');
    process.env.ANDROID_HOME = this.androidHome;
    process.env.PATH = `${process.env.PATH}:${this.androidHome}/cmdline-tools/latest/bin:${this.androidHome}/platform-tools`;
    
    this.log(`ANDROID_HOME: ${this.androidHome}`);
  }

  installSDKComponents() {
    const components = [
      'platform-tools',
      'platforms;android-33',
      'build-tools;33.0.2',
      'cmdline-tools;latest'
    ];

    for (const component of components) {
      this.log(`安裝 ${component}...`);
      this.execCommand(`sdkmanager "${component}"`);
    }
  }

  validateInstallation() {
    const requiredPaths = [
      'platform-tools/adb',
      'build-tools/33.0.2/aapt',
      'platforms/android-33'
    ];

    for (const reqPath of requiredPaths) {
      const fullPath = path.join(this.androidHome, reqPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`必需組件不存在: ${reqPath}`);
      }
    }
    
    this.log('Android SDK 驗證成功！');
  }

  async setup() {
    try {
      this.setupEnvironment();
      
      if (!this.checkSDKInstalled()) {
        this.log('Android SDK 未安裝，使用 GitHub Actions setup-android');
      }
      
      this.validateInstallation();
      this.log('Android SDK 設置完成！');
      
    } catch (error) {
      this.error(`設置失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

module.exports = AndroidSDKSetup;