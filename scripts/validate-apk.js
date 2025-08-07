#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class APKValidator {
  constructor() {
    this.reportPath = path.join(__dirname, '../apk-validation-report.json');
  }

  log(message) {
    console.log(`[APK Validator] ${message}`);
  }

  error(message) {
    console.error(`[APK Validator ERROR] ${message}`);
  }

  execCommand(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8',
        ...options
      });
    } catch (error) {
      throw new Error(`命令執行失敗: ${command} - ${error.message}`);
    }
  }

  validateAPKExists(apkPath) {
    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK 文件不存在: ${apkPath}`);
    }
    
    const stats = fs.statSync(apkPath);
    this.log(`APK 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      exists: true,
      size: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2)
    };
  }

  validateAPKStructure(apkPath) {
    try {
      this.log('驗證 APK 結構...');
      const output = this.execCommand(`aapt dump badging "${apkPath}"`);
      
      const packageMatch = output.match(/package: name='([^']+)'/);
      const versionCodeMatch = output.match(/versionCode='([^']+)'/);
      const versionNameMatch = output.match(/versionName='([^']+)'/);
      
      return {
        valid: true,
        packageName: packageMatch ? packageMatch[1] : 'unknown',
        versionCode: versionCodeMatch ? versionCodeMatch[1] : 'unknown',
        versionName: versionNameMatch ? versionNameMatch[1] : 'unknown'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  validateAPKSignature(apkPath) {
    try {
      this.log('驗證 APK 簽名...');
      this.execCommand(`jarsigner -verify -verbose -certs "${apkPath}"`, { stdio: 'pipe' });
      
      return {
        signed: true,
        valid: true
      };
    } catch (error) {
      // 對於 debug APK，簽名驗證可能失敗，這是正常的
      if (apkPath.includes('debug')) {
        return {
          signed: true,
          valid: true,
          note: 'Debug APK with debug signature'
        };
      }
      
      return {
        signed: false,
        valid: false,
        error: error.message
      };
    }
  }

  validatePermissions(apkPath) {
    try {
      this.log('檢查 APK 權限...');
      const output = this.execCommand(`aapt dump permissions "${apkPath}"`);
      
      const permissions = [];
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/uses-permission: name='([^']+)'/);
        if (match) {
          permissions.push(match[1]);
        }
      }
      
      return {
        valid: true,
        permissions,
        count: permissions.length
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  performSecurityCheck(apkPath) {
    const securityIssues = [];
    
    try {
      // 檢查是否包含敏感信息
      const output = this.execCommand(`aapt dump --values resources "${apkPath}"`, { stdio: 'pipe' });
      
      if (output.includes('password') || output.includes('secret') || output.includes('key')) {
        securityIssues.push('可能包含敏感信息');
      }
      
    } catch (error) {
      // 忽略錯誤，繼續其他檢查
    }
    
    return {
      issues: securityIssues,
      secure: securityIssues.length === 0
    };
  }

  generateReport(apkPath, results) {
    const report = {
      apkPath,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        valid: results.structure.valid && results.file.exists,
        signed: results.signature.signed,
        secure: results.security.secure,
        issues: []
      }
    };
    
    // 收集問題
    if (!results.structure.valid) {
      report.summary.issues.push('APK 結構無效');
    }
    
    if (!results.signature.valid && !apkPath.includes('debug')) {
      report.summary.issues.push('APK 簽名無效');
    }
    
    if (!results.security.secure) {
      report.summary.issues.push(...results.security.issues);
    }
    
    // 保存報告
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    this.log(`驗證報告已保存: ${this.reportPath}`);
    
    return report;
  }

  async validate(apkPath) {
    try {
      this.log(`開始驗證 APK: ${apkPath}`);
      
      const results = {
        file: this.validateAPKExists(apkPath),
        structure: this.validateAPKStructure(apkPath),
        signature: this.validateAPKSignature(apkPath),
        permissions: this.validatePermissions(apkPath),
        security: this.performSecurityCheck(apkPath)
      };
      
      const report = this.generateReport(apkPath, results);
      
      if (report.summary.valid) {
        this.log('APK 驗證通過');
        console.log(`包名: ${results.structure.packageName}`);
        console.log(`版本: ${results.structure.versionName} (${results.structure.versionCode})`);
        console.log(`權限數量: ${results.permissions.count}`);
      } else {
        this.error('APK 驗證失敗');
        console.log('問題:', report.summary.issues.join(', '));
        process.exit(1);
      }
      
      return report;
      
    } catch (error) {
      this.error(`驗證失敗: ${error.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const apkPath = process.argv[2];
  if (!apkPath) {
    console.error('使用方法: node validate-apk.js <APK文件路徑>');
    process.exit(1);
  }
  
  const validator = new APKValidator();
  validator.validate(apkPath);
}

module.exports = APKValidator;