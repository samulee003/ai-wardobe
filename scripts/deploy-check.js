#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DeploymentChecker {
  constructor() {
    this.checklistPath = path.join(__dirname, '../deployment-checklist.json');
    this.checklist = {
      timestamp: new Date().toISOString(),
      items: [],
      summary: {
        total: 0,
        completed: 0,
        pending: 0
      }
    };
  }

  log(message) {
    console.log(`[Deployment Check] ${message}`);
  }

  addCheckItem(name, completed, message = '', details = {}) {
    const item = {
      name,
      completed,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.checklist.items.push(item);
    this.checklist.summary.total++;
    
    if (completed) {
      this.checklist.summary.completed++;
      this.log(`✅ ${name}: ${message}`);
    } else {
      this.checklist.summary.pending++;
      this.log(`⏳ ${name}: ${message}`);
    }
  }

  checkGitHubRepository() {
    const name = 'GitHub 倉庫設置';
    
    try {
      // 檢查是否在 Git 倉庫中
      if (!fs.existsSync('.git')) {
        this.addCheckItem(name, false, '不在 Git 倉庫中');
        return false;
      }

      // 檢查遠程倉庫
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      
      if (remoteUrl.includes('github.com')) {
        this.addCheckItem(name, true, `GitHub 倉庫: ${remoteUrl}`, { remoteUrl });
        return true;
      } else {
        this.addCheckItem(name, false, '不是 GitHub 倉庫');
        return false;
      }

    } catch (error) {
      this.addCheckItem(name, false, `檢查失敗: ${error.message}`);
      return false;
    }
  }

  checkWorkflowFiles() {
    const name = 'GitHub Actions Workflow';
    
    const workflowPath = '.github/workflows/build-apk.yml';
    
    if (fs.existsSync(workflowPath)) {
      const content = fs.readFileSync(workflowPath, 'utf8');
      
      // 檢查關鍵配置
      const hasSecrets = content.includes('secrets.ANDROID_KEYSTORE_BASE64');
      const hasRelease = content.includes('Create GitHub Release');
      
      this.addCheckItem(name, true, 'Workflow 文件存在', {
        hasSecrets,
        hasRelease,
        path: workflowPath
      });
      return true;
    } else {
      this.addCheckItem(name, false, 'Workflow 文件不存在');
      return false;
    }
  }

  checkSecrets() {
    const name = 'GitHub Secrets 配置';
    
    const requiredSecrets = [
      'ANDROID_KEYSTORE_BASE64',
      'ANDROID_KEYSTORE_PASSWORD',
      'ANDROID_KEY_ALIAS',
      'ANDROID_KEY_PASSWORD'
    ];

    const configuredSecrets = [];
    const missingSecrets = [];

    for (const secret of requiredSecrets) {
      if (process.env[secret]) {
        configuredSecrets.push(secret);
      } else {
        missingSecrets.push(secret);
      }
    }

    if (missingSecrets.length === 0) {
      this.addCheckItem(name, true, '所有必需的 Secrets 已配置', {
        configured: configuredSecrets
      });
      return true;
    } else {
      this.addCheckItem(name, false, `缺少 Secrets: ${missingSecrets.join(', ')}`, {
        missing: missingSecrets,
        configured: configuredSecrets
      });
      return false;
    }
  }

  checkCapacitorConfig() {
    const name = 'Capacitor 配置';
    
    const configPath = 'client/capacitor.config.ts';
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      
      // 檢查關鍵配置
      const hasAppId = content.includes('appId:');
      const hasAppName = content.includes('appName:');
      const hasWebDir = content.includes('webDir:');
      
      if (hasAppId && hasAppName && hasWebDir) {
        this.addCheckItem(name, true, 'Capacitor 配置完整', {
          path: configPath
        });
        return true;
      } else {
        this.addCheckItem(name, false, 'Capacitor 配置不完整');
        return false;
      }
    } else {
      this.addCheckItem(name, false, 'Capacitor 配置文件不存在');
      return false;
    }
  }

  checkDocumentation() {
    const name = '文檔完整性';
    
    const requiredDocs = [
      'docs/APK_DOWNLOAD_GUIDE.md',
      'docs/GITHUB_ACTIONS_SETUP.md',
      'docs/FAQ.md',
      'README.md'
    ];

    const existingDocs = [];
    const missingDocs = [];

    for (const doc of requiredDocs) {
      if (fs.existsSync(doc)) {
        existingDocs.push(doc);
      } else {
        missingDocs.push(doc);
      }
    }

    if (missingDocs.length === 0) {
      this.addCheckItem(name, true, '所有文檔已準備', {
        docs: existingDocs
      });
      return true;
    } else {
      this.addCheckItem(name, false, `缺少文檔: ${missingDocs.join(', ')}`, {
        existing: existingDocs,
        missing: missingDocs
      });
      return false;
    }
  }

  checkScripts() {
    const name = '構建腳本';
    
    const requiredScripts = [
      'scripts/setup-capacitor.js',
      'scripts/version-manager.js',
      'scripts/build-apk.js',
      'scripts/test-apk.js',
      'scripts/create-release.js',
      'scripts/security-check.js'
    ];

    const existingScripts = [];
    const missingScripts = [];

    for (const script of requiredScripts) {
      if (fs.existsSync(script)) {
        existingScripts.push(script);
      } else {
        missingScripts.push(script);
      }
    }

    if (missingScripts.length === 0) {
      this.addCheckItem(name, true, '所有構建腳本已準備', {
        scripts: existingScripts
      });
      return true;
    } else {
      this.addCheckItem(name, false, `缺少腳本: ${missingScripts.join(', ')}`, {
        existing: existingScripts,
        missing: missingScripts
      });
      return false;
    }
  }

  checkDependencies() {
    const name = '依賴檢查';
    
    try {
      // 檢查根目錄依賴
      const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 檢查客戶端依賴
      const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
      
      // 檢查 Capacitor 依賴
      const hasCapacitorCore = clientPackageJson.dependencies?.['@capacitor/core'];
      const hasCapacitorAndroid = clientPackageJson.dependencies?.['@capacitor/android'];
      const hasCapacitorCli = clientPackageJson.dependencies?.['@capacitor/cli'] || clientPackageJson.devDependencies?.['@capacitor/cli'];

      if (hasCapacitorCore && hasCapacitorAndroid && hasCapacitorCli) {
        this.addCheckItem(name, true, '依賴配置正確', {
          capacitorCore: hasCapacitorCore,
          capacitorAndroid: hasCapacitorAndroid,
          capacitorCli: hasCapacitorCli
        });
        return true;
      } else {
        this.addCheckItem(name, false, '缺少必需的 Capacitor 依賴');
        return false;
      }

    } catch (error) {
      this.addCheckItem(name, false, `依賴檢查失敗: ${error.message}`);
      return false;
    }
  }

  checkEnvironmentVariables() {
    const name = '環境變數配置';
    
    const envPath = 'client/.env';
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      const hasGithubRepo = content.includes('REACT_APP_GITHUB_REPO');
      const hasVersion = content.includes('REACT_APP_VERSION');
      
      if (hasGithubRepo && hasVersion) {
        this.addCheckItem(name, true, '環境變數配置完整', {
          path: envPath
        });
        return true;
      } else {
        this.addCheckItem(name, false, '環境變數配置不完整');
        return false;
      }
    } else {
      this.addCheckItem(name, false, '環境變數文件不存在');
      return false;
    }
  }

  checkIssueTemplates() {
    const name = 'Issue 模板';
    
    const templatePath = '.github/ISSUE_TEMPLATE/apk-build-issue.md';
    
    if (fs.existsSync(templatePath)) {
      this.addCheckItem(name, true, 'Issue 模板已準備', {
        path: templatePath
      });
      return true;
    } else {
      this.addCheckItem(name, false, 'Issue 模板不存在');
      return false;
    }
  }

  generateDeploymentReport() {
    // 計算完成率
    const completionRate = this.checklist.summary.total > 0 
      ? ((this.checklist.summary.completed / this.checklist.summary.total) * 100).toFixed(1)
      : '0';

    this.checklist.summary.completionRate = `${completionRate}%`;

    // 保存檢查清單
    fs.writeFileSync(this.checklistPath, JSON.stringify(this.checklist, null, 2));

    // 生成部署建議
    const suggestions = this.generateDeploymentSuggestions();

    console.log('\n🚀 部署準備檢查報告:');
    console.log(`   完成率: ${completionRate}%`);
    console.log(`   已完成: ${this.checklist.summary.completed}/${this.checklist.summary.total}`);
    console.log(`   待處理: ${this.checklist.summary.pending}`);

    if (this.checklist.summary.pending > 0) {
      console.log('\n⏳ 待處理項目:');
      this.checklist.items
        .filter(item => !item.completed)
        .forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name}: ${item.message}`);
        });
    }

    if (suggestions.length > 0) {
      console.log('\n💡 部署建議:');
      suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
    }

    console.log(`\n📋 詳細報告: ${this.checklistPath}`);

    return this.checklist.summary.pending === 0;
  }

  generateDeploymentSuggestions() {
    const suggestions = [];

    if (this.checklist.summary.pending > 0) {
      suggestions.push('完成所有待處理項目後再進行部署');
    }

    suggestions.push('在部署前運行完整的集成測試');
    suggestions.push('確保所有文檔都是最新的');
    suggestions.push('準備發布說明和更新日誌');
    suggestions.push('通知用戶即將發布的新版本');
    suggestions.push('監控部署後的應用性能');

    return suggestions;
  }

  async runDeploymentCheck() {
    try {
      this.log('開始部署準備檢查...');

      // 運行所有檢查
      this.checkGitHubRepository();
      this.checkWorkflowFiles();
      this.checkSecrets();
      this.checkCapacitorConfig();
      this.checkDocumentation();
      this.checkScripts();
      this.checkDependencies();
      this.checkEnvironmentVariables();
      this.checkIssueTemplates();

      // 生成報告
      const readyForDeployment = this.generateDeploymentReport();

      if (readyForDeployment) {
        this.log('✅ 部署準備完成，可以開始部署');
        return true;
      } else {
        this.log('⚠️  部署準備未完成，請處理待辦項目');
        return false;
      }

    } catch (error) {
      console.error(`部署檢查失敗: ${error.message}`);
      return false;
    }
  }
}

if (require.main === module) {
  const checker = new DeploymentChecker();
  
  checker.runDeploymentCheck().then(ready => {
    process.exit(ready ? 0 : 1);
  });
}

module.exports = DeploymentChecker;