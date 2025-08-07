#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class GitHubActionsSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message) {
    console.log(`[GitHub Actions Setup] ${message}`);
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  displayWelcome() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    GitHub Actions APK 構建設置                ║
║                                                              ║
║  這個工具將幫助您設置 GitHub Actions 自動構建 Android APK      ║
╚══════════════════════════════════════════════════════════════╝
`);
  }

  async checkPrerequisites() {
    this.log('檢查前置條件...');
    
    const issues = [];
    
    // 檢查是否在 Git 倉庫中
    if (!fs.existsSync('.git')) {
      issues.push('當前目錄不是 Git 倉庫');
    }
    
    // 檢查 GitHub workflow 目錄
    const workflowDir = '.github/workflows';
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
      this.log('創建 .github/workflows 目錄');
    }
    
    // 檢查必要文件
    const requiredFiles = [
      'client/package.json',
      'client/capacitor.config.ts'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        issues.push(`缺少必要文件: ${file}`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\n❌ 發現問題:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\n請先解決這些問題再繼續設置。');
      return false;
    }
    
    this.log('✅ 前置條件檢查通過');
    return true;
  }

  async setupKeystore() {
    console.log('\n📱 Android 簽名設置');
    console.log('為了發布 release 版本的 APK，您需要創建 Android keystore。');
    
    const createKeystore = await this.question('是否需要創建新的 keystore？(y/n): ');
    
    if (createKeystore.toLowerCase() === 'y') {
      console.log('\n正在生成 keystore...');
      
      try {
        const KeystoreGenerator = require('./generate-keystore');
        const generator = new KeystoreGenerator();
        generator.generateKeystore();
        
        console.log('\n✅ Keystore 生成完成！');
        console.log('請將上面顯示的信息添加到 GitHub Secrets 中。');
        
      } catch (error) {
        console.log(`❌ Keystore 生成失敗: ${error.message}`);
        console.log('您可以稍後手動運行: node scripts/generate-keystore.js');
      }
    }
  }

  async setupGitHubSecrets() {
    console.log('\n🔐 GitHub Secrets 設置指南');
    console.log('請在 GitHub 倉庫中設置以下 Secrets:');
    console.log('');
    console.log('1. 進入您的 GitHub 倉庫');
    console.log('2. 點擊 Settings > Secrets and variables > Actions');
    console.log('3. 點擊 "New repository secret" 添加以下 secrets:');
    console.log('');
    console.log('   ANDROID_KEYSTORE_BASE64     - keystore 文件的 Base64 編碼');
    console.log('   ANDROID_KEYSTORE_PASSWORD   - keystore 密碼');
    console.log('   ANDROID_KEY_ALIAS          - 密鑰別名');
    console.log('   ANDROID_KEY_PASSWORD       - 密鑰密碼');
    console.log('');
    
    await this.question('按 Enter 繼續...');
  }

  async setupWorkflow() {
    console.log('\n⚙️  設置 GitHub Actions Workflow');
    
    const workflowPath = '.github/workflows/build-apk.yml';
    
    if (fs.existsSync(workflowPath)) {
      const overwrite = await this.question('Workflow 文件已存在，是否覆蓋？(y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        this.log('跳過 workflow 設置');
        return;
      }
    }
    
    this.log('Workflow 文件已存在，無需重新創建');
  }

  async setupEnvironmentVariables() {
    console.log('\n🌍 環境變數設置');
    
    const clientPackageJsonPath = 'client/package.json';
    const packageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
    
    // 設置版本信息
    if (!process.env.REACT_APP_VERSION) {
      packageJson.scripts = {
        ...packageJson.scripts,
        'build:env': 'REACT_APP_VERSION=$npm_package_version npm run build'
      };
    }
    
    // 設置 GitHub 倉庫信息
    const repoUrl = await this.question('請輸入 GitHub 倉庫地址 (格式: owner/repo): ');
    if (repoUrl) {
      packageJson.homepage = `https://github.com/${repoUrl}`;
      
      // 創建 .env 文件
      const envContent = `REACT_APP_GITHUB_REPO=${repoUrl}\nREACT_APP_VERSION=${packageJson.version}\n`;
      fs.writeFileSync('client/.env', envContent);
      this.log('環境變數文件已創建');
    }
    
    fs.writeFileSync(clientPackageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('package.json 已更新');
  }

  async setupDocumentation() {
    console.log('\n📚 創建文檔');
    
    const docsDir = 'docs';
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }
    
    // 創建 APK 下載指南
    const downloadGuide = `# APK 下載安裝指南

## 📱 如何下載和安裝 APK

### 1. 下載 APK
- 訪問 [GitHub Releases](https://github.com/YOUR_REPO/releases)
- 下載最新版本的 APK 文件

### 2. 安裝 APK
1. 在 Android 設備上啟用「未知來源」安裝
2. 點擊下載的 APK 文件
3. 按照提示完成安裝

### 3. 系統要求
- Android 8.0+ (API level 26+)
- 2GB+ RAM
- 100MB+ 可用存儲空間

## 🔄 自動更新
應用內置更新檢查功能，會自動提醒您下載新版本。

## ❓ 常見問題
如有問題，請在 GitHub Issues 中反饋。
`;

    fs.writeFileSync(path.join(docsDir, 'APK_DOWNLOAD_GUIDE.md'), downloadGuide);
    this.log('APK 下載指南已創建');
  }

  async runDiagnostics() {
    console.log('\n🔍 運行診斷檢查');
    
    try {
      const APKErrorDiagnostics = require('./apk-error-diagnostics');
      const diagnostics = new APKErrorDiagnostics();
      await diagnostics.diagnose();
    } catch (error) {
      console.log(`診斷檢查失敗: ${error.message}`);
    }
  }

  displayNextSteps() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                        設置完成！                             ║
╚══════════════════════════════════════════════════════════════╝

🎉 GitHub Actions APK 構建系統已設置完成！

📋 下一步操作:

1. 📤 推送代碼到 GitHub:
   git add .
   git commit -m "Add GitHub Actions APK build"
   git push

2. 🔐 設置 GitHub Secrets (如果還沒有):
   - 進入 GitHub 倉庫 Settings > Secrets and variables > Actions
   - 添加 Android 簽名相關的 secrets

3. 🚀 觸發構建:
   - 推送到 main 分支自動觸發
   - 或在 Actions 頁面手動觸發

4. 📱 下載 APK:
   - 構建完成後在 GitHub Releases 中下載

📖 更多信息請查看 docs/APK_DOWNLOAD_GUIDE.md

祝您使用愉快！ 🎊
`);
  }

  async setup() {
    try {
      this.displayWelcome();
      
      const proceed = await this.question('是否繼續設置？(y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('設置已取消');
        this.rl.close();
        return;
      }
      
      // 檢查前置條件
      if (!(await this.checkPrerequisites())) {
        this.rl.close();
        return;
      }
      
      // 設置步驟
      await this.setupKeystore();
      await this.setupGitHubSecrets();
      await this.setupWorkflow();
      await this.setupEnvironmentVariables();
      await this.setupDocumentation();
      await this.runDiagnostics();
      
      this.displayNextSteps();
      
    } catch (error) {
      console.error('設置失敗:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

if (require.main === module) {
  const setup = new GitHubActionsSetup();
  setup.setup();
}

module.exports = GitHubActionsSetup;