#!/usr/bin/env node

/**
 * 構建前檢查腳本
 * 在執行構建之前驗證所有必要條件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreBuildChecker {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.checks = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      fix: '🔧'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addCheck(name, checkFn, fixFn = null) {
    this.checks.push({ name, checkFn, fixFn });
  }

  async runCheck(check) {
    this.log(`Checking: ${check.name}`);
    
    try {
      const result = await check.checkFn();
      
      if (result.success) {
        this.log(`✓ ${check.name} - OK`, 'success');
        return true;
      } else {
        this.log(`✗ ${check.name} - ${result.message}`, 'error');
        
        if (check.fixFn && result.canFix) {
          this.log(`Attempting to fix: ${check.name}`, 'fix');
          const fixResult = await check.fixFn();
          
          if (fixResult.success) {
            this.log(`✓ Fixed: ${check.name}`, 'success');
            this.fixes.push(check.name);
            return true;
          } else {
            this.log(`✗ Fix failed: ${fixResult.message}`, 'error');
            return false;
          }
        }
        
        return false;
      }
    } catch (error) {
      this.log(`✗ ${check.name} - Error: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('Starting pre-build checks...', 'info');
    
    // Define all checks
    this.addCheck(
      'Node.js version compatibility',
      async () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion >= 16) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Node.js ${nodeVersion} is too old. Requires Node.js 16+`,
            canFix: false
          };
        }
      }
    );

    this.addCheck(
      'Root package.json exists',
      async () => {
        const packagePath = path.join(this.rootDir, 'package.json');
        if (fs.existsSync(packagePath)) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'package.json not found in root directory',
            canFix: false
          };
        }
      }
    );

    this.addCheck(
      'Client package.json exists',
      async () => {
        const packagePath = path.join(this.clientDir, 'package.json');
        if (fs.existsSync(packagePath)) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'package.json not found in client directory',
            canFix: false
          };
        }
      }
    );

    this.addCheck(
      'Root dependencies installed',
      async () => {
        const nodeModulesPath = path.join(this.rootDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Root node_modules not found',
            canFix: true
          };
        }
      },
      async () => {
        try {
          execSync('npm install', { cwd: this.rootDir, stdio: 'inherit' });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    );

    this.addCheck(
      'Client dependencies installed',
      async () => {
        const nodeModulesPath = path.join(this.clientDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Client node_modules not found',
            canFix: true
          };
        }
      },
      async () => {
        try {
          execSync('npm install', { cwd: this.clientDir, stdio: 'inherit' });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    );

    this.addCheck(
      'react-scripts available',
      async () => {
        const reactScriptsPath = path.join(this.clientDir, 'node_modules', 'react-scripts');
        if (fs.existsSync(reactScriptsPath)) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'react-scripts not found in client/node_modules',
            canFix: true
          };
        }
      },
      async () => {
        try {
          execSync('npm install react-scripts', { cwd: this.clientDir, stdio: 'inherit' });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    );

    this.addCheck(
      'Build scripts configured',
      async () => {
        const packagePath = path.join(this.rootDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const requiredScripts = ['build', 'build:client', 'install:client'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
        
        if (missingScripts.length === 0) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Missing build scripts: ${missingScripts.join(', ')}`,
            canFix: false
          };
        }
      }
    );

    // Run all checks
    let allPassed = true;
    for (const check of this.checks) {
      const passed = await this.runCheck(check);
      if (!passed) {
        allPassed = false;
      }
    }

    // Report results
    this.log('\n=== Pre-Build Check Report ===');
    
    if (this.fixes.length > 0) {
      this.log(`Applied ${this.fixes.length} fix(es):`, 'fix');
      this.fixes.forEach(fix => this.log(`  - ${fix}`, 'fix'));
    }

    if (allPassed) {
      this.log('All pre-build checks passed! Ready to build.', 'success');
      return true;
    } else {
      this.log('Some pre-build checks failed. Please fix the issues above.', 'error');
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new PreBuildChecker();
  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Pre-build check failed:', error);
    process.exit(1);
  });
}

module.exports = PreBuildChecker;