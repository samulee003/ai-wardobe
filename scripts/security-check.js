#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityChecker {
  constructor() {
    this.reportPath = path.join(__dirname, '../security-report.json');
    this.issues = [];
    this.warnings = [];
  }

  log(message) {
    console.log(`[Security Check] ${message}`);
  }

  warn(message) {
    console.warn(`[Security Check WARN] ${message}`);
    this.warnings.push(message);
  }

  error(message) {
    console.error(`[Security Check ERROR] ${message}`);
    this.issues.push(message);
  }

  checkGitHubSecrets() {
    this.log('檢查 GitHub Secrets 配置...');
    
    const requiredSecrets = [
      'ANDROID_KEYSTORE_BASE64',
      'ANDROID_KEYSTORE_PASSWORD', 
      'ANDROID_KEY_ALIAS',
      'ANDROID_KEY_PASSWORD'
    ];

    const missingSecrets = [];
    
    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        missingSecrets.push(secret);
      }
    }

    if (missingSecrets.length > 0) {
      this.error(`缺少必需的 GitHub Secrets: ${missingSecrets.join(', ')}`);
    } else {
      this.log('GitHub Secrets 配置檢查通過');
    }

    return missingSecrets.length === 0;
  }

  checkKeystoreSecurity() {
    this.log('檢查 keystore 安全性...');
    
    // 檢查是否有本地 keystore 文件
    const possibleKeystorePaths = [
      'android-keystore.jks',
      'keystore.jks',
      'app-keystore.jks',
      'client/android/app/keystore.jks'
    ];

    let foundLocalKeystore = false;
    for (const keystorePath of possibleKeystorePaths) {
      if (fs.existsSync(keystorePath)) {
        this.error(`發現本地 keystore 文件: ${keystorePath} - 應該刪除並使用 GitHub Secrets`);
        foundLocalKeystore = true;
      }
    }

    if (!foundLocalKeystore) {
      this.log('未發現本地 keystore 文件，安全檢查通過');
    }

    // 檢查 keystore 密碼強度
    const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
    if (keystorePassword) {
      if (keystorePassword.length < 8) {
        this.warn('keystore 密碼長度少於 8 位，建議使用更強的密碼');
      }
      
      if (!/[A-Z]/.test(keystorePassword) || !/[a-z]/.test(keystorePassword) || !/[0-9]/.test(keystorePassword)) {
        this.warn('keystore 密碼建議包含大小寫字母和數字');
      }
    }

    return !foundLocalKeystore;
  }

  checkCodeSecurity() {
    this.log('檢查代碼安全性...');
    
    const sensitivePatterns = [
      { pattern: /password\s*=\s*["'][^"']+["']/gi, message: '代碼中可能包含硬編碼密碼' },
      { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, message: '代碼中可能包含硬編碼 API 密鑰' },
      { pattern: /secret\s*=\s*["'][^"']+["']/gi, message: '代碼中可能包含硬編碼密鑰' },
      { pattern: /token\s*=\s*["'][^"']+["']/gi, message: '代碼中可能包含硬編碼令牌' }
    ];

    const filesToCheck = [
      'client/src/**/*.js',
      'client/src/**/*.ts',
      'server/**/*.js',
      'scripts/**/*.js'
    ];

    let securityIssuesFound = false;

    // 簡化的文件檢查（實際應該使用 glob）
    const checkDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          checkDirectory(filePath);
        } else if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const { pattern, message } of sensitivePatterns) {
              if (pattern.test(content)) {
                this.warn(`${message} - 文件: ${filePath}`);
                securityIssuesFound = true;
              }
            }
          } catch (error) {
            // 忽略讀取錯誤
          }
        }
      }
    };

    checkDirectory('client/src');
    checkDirectory('server');
    checkDirectory('scripts');

    if (!securityIssuesFound) {
      this.log('代碼安全檢查通過');
    }

    return !securityIssuesFound;
  }

  checkFilePermissions() {
    this.log('檢查文件權限...');
    
    const sensitiveFiles = [
      '.env',
      'client/.env',
      '.env.local',
      'client/.env.local'
    ];

    let permissionIssues = false;

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          const mode = stats.mode & parseInt('777', 8);
          
          // 檢查是否對其他用戶可讀
          if (mode & parseInt('044', 8)) {
            this.warn(`文件 ${file} 對其他用戶可讀，建議設置更嚴格的權限`);
            permissionIssues = true;
          }
        } catch (error) {
          // 忽略權限檢查錯誤
        }
      }
    }

    if (!permissionIssues) {
      this.log('文件權限檢查通過');
    }

    return !permissionIssues;
  }

  checkGitIgnore() {
    this.log('檢查 .gitignore 配置...');
    
    const gitignorePath = '.gitignore';
    const requiredIgnores = [
      '*.jks',
      '*.keystore',
      '.env',
      '.env.local',
      'android-keystore.*',
      'keystore.*'
    ];

    if (!fs.existsSync(gitignorePath)) {
      this.error('.gitignore 文件不存在');
      return false;
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const missingIgnores = [];

    for (const ignore of requiredIgnores) {
      if (!gitignoreContent.includes(ignore)) {
        missingIgnores.push(ignore);
      }
    }

    if (missingIgnores.length > 0) {
      this.warn(`建議在 .gitignore 中添加: ${missingIgnores.join(', ')}`);
    } else {
      this.log('.gitignore 配置檢查通過');
    }

    return missingIgnores.length === 0;
  }

  checkWorkflowSecurity() {
    this.log('檢查 GitHub Actions workflow 安全性...');
    
    const workflowPath = '.github/workflows/build-apk.yml';
    
    if (!fs.existsSync(workflowPath)) {
      this.error('GitHub Actions workflow 文件不存在');
      return false;
    }

    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    let securityIssues = false;

    // 檢查是否使用了固定版本的 actions
    const actionPatterns = [
      /uses:\s*actions\/checkout@v\d+/g,
      /uses:\s*actions\/setup-node@v\d+/g,
      /uses:\s*actions\/setup-java@v\d+/g
    ];

    for (const pattern of actionPatterns) {
      if (!pattern.test(workflowContent)) {
        this.warn('建議使用固定版本的 GitHub Actions');
        securityIssues = true;
        break;
      }
    }

    // 檢查是否有不安全的命令
    if (workflowContent.includes('curl') && !workflowContent.includes('https://')) {
      this.warn('workflow 中使用了可能不安全的 curl 命令');
      securityIssues = true;
    }

    if (!securityIssues) {
      this.log('GitHub Actions workflow 安全檢查通過');
    }

    return !securityIssues;
  }

  checkAPKSecurity(apkPath) {
    if (!apkPath || !fs.existsSync(apkPath)) {
      this.log('跳過 APK 安全檢查（APK 文件不存在）');
      return true;
    }

    this.log(`檢查 APK 安全性: ${apkPath}`);
    
    try {
      // 檢查 APK 權限
      const { execSync } = require('child_process');
      const permissionsOutput = execSync(`aapt dump permissions "${apkPath}"`, { encoding: 'utf8' });
      
      const dangerousPermissions = [
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_CONTACTS'
      ];

      const grantedPermissions = [];
      const lines = permissionsOutput.split('\n');
      
      for (const line of lines) {
        const match = line.match(/uses-permission: name='([^']+)'/);
        if (match) {
          grantedPermissions.push(match[1]);
        }
      }

      for (const permission of dangerousPermissions) {
        if (grantedPermissions.includes(permission)) {
          this.warn(`APK 包含敏感權限: ${permission}`);
        }
      }

      this.log('APK 安全檢查完成');
      return true;

    } catch (error) {
      this.warn(`APK 安全檢查失敗: ${error.message}`);
      return false;
    }
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        totalWarnings: this.warnings.length,
        securityLevel: this.getSecurityLevel()
      },
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.getRecommendations()
    };

    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  getSecurityLevel() {
    if (this.issues.length === 0 && this.warnings.length === 0) {
      return 'HIGH';
    } else if (this.issues.length === 0 && this.warnings.length <= 3) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  getRecommendations() {
    const recommendations = [];

    if (this.issues.length > 0) {
      recommendations.push('立即修復所有安全問題');
    }

    if (this.warnings.length > 0) {
      recommendations.push('考慮修復安全警告以提高安全性');
    }

    recommendations.push('定期運行安全檢查');
    recommendations.push('保持依賴項更新');
    recommendations.push('使用強密碼和多因素認證');
    recommendations.push('定期輪換簽名密鑰');

    return recommendations;
  }

  async runSecurityCheck(apkPath = null) {
    try {
      this.log('開始安全檢查...');

      // 運行所有安全檢查
      this.checkGitHubSecrets();
      this.checkKeystoreSecurity();
      this.checkCodeSecurity();
      this.checkFilePermissions();
      this.checkGitIgnore();
      this.checkWorkflowSecurity();
      
      if (apkPath) {
        this.checkAPKSecurity(apkPath);
      }

      // 生成報告
      const report = this.generateSecurityReport();

      // 輸出結果
      console.log('\n🔒 安全檢查報告:');
      console.log(`   安全等級: ${report.summary.securityLevel}`);
      console.log(`   問題數量: ${report.summary.totalIssues}`);
      console.log(`   警告數量: ${report.summary.totalWarnings}`);

      if (this.issues.length > 0) {
        console.log('\n❌ 安全問題:');
        this.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️  安全警告:');
        this.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning}`);
        });
      }

      console.log(`\n📋 詳細報告: ${this.reportPath}`);

      return report.summary.totalIssues === 0;

    } catch (error) {
      this.error(`安全檢查失敗: ${error.message}`);
      return false;
    }
  }
}

if (require.main === module) {
  const apkPath = process.argv[2];
  const checker = new SecurityChecker();
  
  checker.runSecurityCheck(apkPath).then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = SecurityChecker;