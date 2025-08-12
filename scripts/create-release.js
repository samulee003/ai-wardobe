#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubReleaseManager {
  constructor() {
    this.owner = process.env.GITHUB_REPOSITORY?.split('/')[0];
    this.repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
    this.token = process.env.GITHUB_TOKEN;
    this.versionFile = path.join(__dirname, '../version.json');
  }

  log(message) {
    console.log(`[GitHub Release] ${message}`);
  }

  error(message) {
    console.error(`[GitHub Release ERROR] ${message}`);
  }

  loadVersionInfo() {
    if (!fs.existsSync(this.versionFile)) {
      throw new Error('版本信息文件不存在');
    }
    
    return JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
  }

  generateReleaseNotes(versionInfo) {
    const notes = `# 智能衣櫥 Android APK v${versionInfo.versionName}

## 📱 安裝說明

1. 下載下方的 APK 文件
2. 在 Android 設備上啟用「未知來源」安裝
3. 點擊 APK 文件進行安裝
4. 享受智能衣櫥管理功能！

## 📋 版本信息

- **版本號**: ${versionInfo.versionName}
- **版本代碼**: ${versionInfo.versionCode}
- **構建號**: ${versionInfo.buildNumber}
- **構建日期**: ${versionInfo.buildDate}
- **Git 提交**: ${versionInfo.gitCommit}

## ✨ 主要功能

- 📷 智能拍照識別衣物
- 🤖 AI 自動分析衣物屬性
- 👔 數位衣櫃管理
- ✨ 智能穿搭推薦
- 📊 穿著統計分析
 

## 🔧 系統要求

- Android 8.0+ (API level 26+)
- 2GB+ RAM
- 100MB+ 可用存儲空間

## 📞 支持

如有問題，請在 GitHub Issues 中反饋。`;

    return notes;
  }

  async createRelease(versionInfo, apkPath, isPrerelease = false) {
    try {
      this.log(`創建 GitHub Release: v${versionInfo.versionName}`);
      
      const tagName = `v${versionInfo.versionName}`;
      const releaseName = `智能衣櫥 v${versionInfo.versionName}`;
      const releaseNotes = this.generateReleaseNotes(versionInfo);
      
      // 使用 GitHub CLI 創建 release
      const createCommand = [
        'gh', 'release', 'create', tagName,
        '--title', `"${releaseName}"`,
        '--notes', `"${releaseNotes}"`,
        isPrerelease ? '--prerelease' : '',
        apkPath
      ].filter(Boolean).join(' ');
      
      execSync(createCommand, { stdio: 'inherit' });
      
      this.log(`Release 創建成功: ${tagName}`);
      
      // 獲取 release URL
      const releaseUrl = `https://github.com/${this.owner}/${this.repo}/releases/tag/${tagName}`;
      
      // 輸出到 GitHub Actions
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `release_url=${releaseUrl}\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag_name=${tagName}\n`);
      }
      
      return {
        tagName,
        releaseName,
        releaseUrl,
        success: true
      };
      
    } catch (error) {
      this.error(`創建 Release 失敗: ${error.message}`);
      throw error;
    }
  }

  async updateRelease(tagName, apkPath) {
    try {
      this.log(`更新 Release: ${tagName}`);
      
      // 上傳新的 APK 文件
      execSync(`gh release upload ${tagName} ${apkPath} --clobber`, { stdio: 'inherit' });
      
      this.log('Release 更新成功');
      
    } catch (error) {
      this.error(`更新 Release 失敗: ${error.message}`);
      throw error;
    }
  }

  checkGitHubCLI() {
    try {
      execSync('gh --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      throw new Error('GitHub CLI 未安裝或未配置');
    }
  }

  async publishRelease(apkPath, isPrerelease = false) {
    try {
      this.checkGitHubCLI();
      
      if (!fs.existsSync(apkPath)) {
        throw new Error(`APK 文件不存在: ${apkPath}`);
      }
      
      const versionInfo = this.loadVersionInfo();
      const result = await this.createRelease(versionInfo, apkPath, isPrerelease);
      
      this.log('GitHub Release 發布完成');
      return result;
      
    } catch (error) {
      this.error(`發布失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const apkPath = process.argv[2];
  const isPrerelease = process.argv[3] === '--prerelease';
  
  if (!apkPath) {
    console.error('使用方法: node create-release.js <APK文件路徑> [--prerelease]');
    process.exit(1);
  }
  
  const manager = new GitHubReleaseManager();
  manager.publishRelease(apkPath, isPrerelease);
}

module.exports = GitHubReleaseManager;