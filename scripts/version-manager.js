#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VersionManager {
  constructor() {
    this.versionFile = path.join(__dirname, '../version.json');
    this.buildGradlePath = path.join(__dirname, '../client/android/app/build.gradle');
  }

  log(message) {
    console.log(`[Version Manager] ${message}`);
  }

  getGitInfo() {
    try {
      const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const gitTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
      const commitCount = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim());
      
      return {
        commit: gitCommit,
        tag: gitTag,
        commitCount
      };
    } catch (error) {
      this.log('無法獲取 Git 信息，使用默認值');
      return {
        commit: 'unknown',
        tag: '',
        commitCount: 1
      };
    }
  }

  generateVersion() {
    const gitInfo = this.getGitInfo();
    const buildNumber = process.env.GITHUB_RUN_NUMBER || '1';
    const buildDate = new Date().toISOString().split('T')[0];
    
    let versionName;
    if (gitInfo.tag && gitInfo.tag.startsWith('v')) {
      versionName = gitInfo.tag.substring(1); // 移除 'v' 前綴
    } else {
      versionName = `${buildDate}.${buildNumber}`;
    }
    
    const versionCode = gitInfo.commitCount;
    
    const versionInfo = {
      versionName,
      versionCode,
      buildNumber,
      gitCommit: gitInfo.commit.substring(0, 8),
      buildDate,
      fullCommit: gitInfo.commit
    };
    
    this.log(`生成版本信息: ${versionName} (${versionCode})`);
    return versionInfo;
  }

  saveVersionInfo(versionInfo) {
    fs.writeFileSync(this.versionFile, JSON.stringify(versionInfo, null, 2));
    this.log(`版本信息已保存到 ${this.versionFile}`);
  }

  updateBuildGradle(versionInfo) {
    if (!fs.existsSync(this.buildGradlePath)) {
      this.log('build.gradle 文件不存在，跳過更新');
      return;
    }

    let buildGradleContent = fs.readFileSync(this.buildGradlePath, 'utf8');
    
    // 更新 versionCode
    buildGradleContent = buildGradleContent.replace(
      /versionCode\s+\d+/,
      `versionCode ${versionInfo.versionCode}`
    );
    
    // 更新 versionName
    buildGradleContent = buildGradleContent.replace(
      /versionName\s+"[^"]*"/,
      `versionName "${versionInfo.versionName}"`
    );
    
    fs.writeFileSync(this.buildGradlePath, buildGradleContent);
    this.log('build.gradle 版本信息已更新');
  }

  loadVersionInfo() {
    if (fs.existsSync(this.versionFile)) {
      return JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
    }
    return null;
  }

  updateVersion() {
    try {
      const versionInfo = this.generateVersion();
      this.saveVersionInfo(versionInfo);
      this.updateBuildGradle(versionInfo);
      
      // 輸出環境變數供 GitHub Actions 使用
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `version_name=${versionInfo.versionName}\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `version_code=${versionInfo.versionCode}\n`);
      }
      
      this.log('版本管理完成');
      return versionInfo;
      
    } catch (error) {
      console.error('版本管理失敗:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const manager = new VersionManager();
  manager.updateVersion();
}

module.exports = VersionManager;