#!/usr/bin/env node

/**
 * 依賴修復工具
 * 自動檢測並修復項目依賴問題
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyFixer {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.issues = [];
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

  async checkReactScripts() {
    this.log('Checking react-scripts...');
    
    const clientPackagePath = path.join(this.clientDir, 'package.json');
    const reactScriptsPath = path.join(this.clientDir, 'node_modules', 'react-scripts');
    
    if (!fs.existsSync(clientPackagePath)) {
      this.issues.push({
        type: 'missing_file',
        message: 'Client package.json not found',
        canFix: false
      });
      return false;
    }

    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    
    // Check if react-scripts is in dependencies
    if (!clientPackage.dependencies || !clientPackage.dependencies['react-scripts']) {
      this.issues.push({
        type: 'missing_dependency',
        message: 'react-scripts not found in client package.json',
        canFix: true,
        fix: () => this.addReactScriptsDependency()
      });
      return false;
    }

    // Check if react-scripts is installed
    if (!fs.existsSync(reactScriptsPath)) {
      this.issues.push({
        type: 'missing_installation',
        message: 'react-scripts not installed in node_modules',
        canFix: true,
        fix: () => this.installClientDependencies()
      });
      return false;
    }

    this.log('react-scripts is properly configured', 'success');
    return true;
  }

  async addReactScriptsDependency() {
    this.log('Adding react-scripts to client dependencies...', 'fix');
    
    const clientPackagePath = path.join(this.clientDir, 'package.json');
    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    
    if (!clientPackage.dependencies) {
      clientPackage.dependencies = {};
    }
    
    clientPackage.dependencies['react-scripts'] = '^5.0.1';
    
    fs.writeFileSync(clientPackagePath, JSON.stringify(clientPackage, null, 2));
    this.fixes.push('Added react-scripts to client dependencies');
    
    return await this.installClientDependencies();
  }

  async installClientDependencies() {
    this.log('Installing client dependencies...', 'fix');
    
    try {
      execSync('npm install', { 
        cwd: this.clientDir, 
        stdio: 'inherit',
        timeout: 300000
      });
      this.fixes.push('Installed client dependencies');
      return true;
    } catch (error) {
      this.log(`Failed to install client dependencies: ${error.message}`, 'error');
      return false;
    }
  }

  async checkVersionCompatibility() {
    this.log('Checking version compatibility...');
    
    const clientPackagePath = path.join(this.clientDir, 'package.json');
    if (!fs.existsSync(clientPackagePath)) return false;
    
    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    const deps = clientPackage.dependencies || {};
    
    // Check React version compatibility
    const reactVersion = deps.react;
    const reactScriptsVersion = deps['react-scripts'];
    
    if (reactVersion && reactScriptsVersion) {
      // Extract major versions
      const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, '').charAt(0));
      const scriptsMajor = parseInt(reactScriptsVersion.replace(/[^\d]/g, '').charAt(0));
      
      if (reactMajor >= 18 && scriptsMajor < 5) {
        this.issues.push({
          type: 'version_conflict',
          message: 'React 18+ requires react-scripts 5+',
          canFix: true,
          fix: () => this.updateReactScripts()
        });
        return false;
      }
    }
    
    this.log('Version compatibility check passed', 'success');
    return true;
  }

  async updateReactScripts() {
    this.log('Updating react-scripts to compatible version...', 'fix');
    
    try {
      execSync('npm install react-scripts@^5.0.1', { 
        cwd: this.clientDir, 
        stdio: 'inherit',
        timeout: 300000
      });
      this.fixes.push('Updated react-scripts to version 5.0.1');
      return true;
    } catch (error) {
      this.log(`Failed to update react-scripts: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBuildScripts() {
    this.log('Checking build scripts configuration...');
    
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    
    const requiredScripts = {
      'build': 'npm run install:client && npm run build:client && npm run build:server',
      'build:client': 'cd client && npm run build',
      'install:client': 'cd client && npm install'
    };
    
    let needsUpdate = false;
    const currentScripts = rootPackage.scripts || {};
    
    for (const [scriptName, expectedCommand] of Object.entries(requiredScripts)) {
      if (!currentScripts[scriptName] || currentScripts[scriptName] !== expectedCommand) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      this.issues.push({
        type: 'script_config',
        message: 'Build scripts need updating',
        canFix: true,
        fix: () => this.updateBuildScripts()
      });
      return false;
    }
    
    this.log('Build scripts are properly configured', 'success');
    return true;
  }

  async updateBuildScripts() {
    this.log('Updating build scripts...', 'fix');
    
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    
    if (!rootPackage.scripts) {
      rootPackage.scripts = {};
    }
    
    rootPackage.scripts.build = 'npm run install:client && npm run build:client && npm run build:server';
    rootPackage.scripts['build:client'] = 'cd client && npm run build';
    rootPackage.scripts['install:client'] = 'cd client && npm install';
    
    fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
    this.fixes.push('Updated build scripts configuration');
    return true;
  }

  async testBuild() {
    this.log('Testing build process...');
    
    try {
      // Test client build specifically
      execSync('npm run build:client', { 
        cwd: this.rootDir,
        stdio: 'pipe',
        timeout: 120000
      });
      this.log('Build test successful', 'success');
      return true;
    } catch (error) {
      this.log(`Build test failed: ${error.message}`, 'warn');
      return false;
    }
  }

  async run() {
    this.log('Starting dependency check and repair...', 'info');
    
    // Run all checks
    await this.checkReactScripts();
    await this.checkVersionCompatibility();
    await this.checkBuildScripts();
    
    // Apply fixes
    let allFixed = true;
    for (const issue of this.issues) {
      if (issue.canFix && issue.fix) {
        this.log(`Fixing: ${issue.message}`, 'fix');
        const success = await issue.fix();
        if (!success) {
          allFixed = false;
        }
      } else {
        this.log(`Cannot auto-fix: ${issue.message}`, 'error');
        allFixed = false;
      }
    }
    
    // Test build after fixes
    if (allFixed && this.fixes.length > 0) {
      await this.testBuild();
    }
    
    // Report results
    this.log('\n=== Dependency Fix Report ===');
    
    if (this.fixes.length > 0) {
      this.log(`Applied ${this.fixes.length} fix(es):`, 'success');
      this.fixes.forEach(fix => this.log(`  ✓ ${fix}`, 'success'));
    }
    
    if (this.issues.length === 0) {
      this.log('No dependency issues found!', 'success');
    } else {
      const unfixedIssues = this.issues.filter(issue => !issue.canFix);
      if (unfixedIssues.length > 0) {
        this.log(`${unfixedIssues.length} issue(s) require manual attention:`, 'warn');
        unfixedIssues.forEach(issue => this.log(`  - ${issue.message}`, 'warn'));
      }
    }
    
    return allFixed;
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new DependencyFixer();
  fixer.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Dependency fix failed:', error);
    process.exit(1);
  });
}

module.exports = DependencyFixer;