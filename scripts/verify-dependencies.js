#!/usr/bin/env node

/**
 * 依賴驗證腳本
 * 檢查並驗證項目的所有依賴項是否正確安裝
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyVerifier {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      success: '🎉'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPackageJson(dir, name) {
    const packagePath = path.join(dir, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.errors.push(`${name} package.json not found at ${packagePath}`);
      return null;
    }

    try {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      this.log(`${name} package.json found and valid`);
      return packageContent;
    } catch (error) {
      this.errors.push(`${name} package.json is invalid: ${error.message}`);
      return null;
    }
  }

  async checkNodeModules(dir, name) {
    const nodeModulesPath = path.join(dir, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      this.errors.push(`${name} node_modules directory not found`);
      return false;
    }

    this.log(`${name} node_modules directory exists`);
    return true;
  }

  async checkCriticalDependencies(dir, packageJson, criticalDeps) {
    const nodeModulesPath = path.join(dir, 'node_modules');
    
    for (const dep of criticalDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      
      if (!fs.existsSync(depPath)) {
        this.errors.push(`Critical dependency '${dep}' not found in ${dir}`);
      } else {
        this.log(`Critical dependency '${dep}' found`);
      }
    }
  }

  async installMissingDependencies(dir, name) {
    this.log(`Installing dependencies for ${name}...`);
    
    try {
      const command = 'npm install';
      execSync(command, { 
        cwd: dir, 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      this.log(`Dependencies installed successfully for ${name}`, 'success');
      return true;
    } catch (error) {
      this.errors.push(`Failed to install dependencies for ${name}: ${error.message}`);
      return false;
    }
  }

  async verifyReactScripts() {
    const clientNodeModules = path.join(this.clientDir, 'node_modules');
    const reactScriptsPath = path.join(clientNodeModules, 'react-scripts');
    
    if (!fs.existsSync(reactScriptsPath)) {
      this.errors.push('react-scripts not found in client/node_modules');
      return false;
    }

    // Check if react-scripts binary exists
    const reactScriptsBin = path.join(reactScriptsPath, 'bin', 'react-scripts.js');
    if (!fs.existsSync(reactScriptsBin)) {
      this.errors.push('react-scripts binary not found');
      return false;
    }

    this.log('react-scripts found and accessible', 'success');
    return true;
  }

  async testBuildCommand() {
    this.log('Testing build command...');
    
    try {
      // Test if we can run the build command
      execSync('npm run build:client', { 
        cwd: this.rootDir,
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout for test
      });
      this.log('Build command test successful', 'success');
      return true;
    } catch (error) {
      this.warnings.push(`Build command test failed: ${error.message}`);
      return false;
    }
  }

  async run() {
    this.log('Starting dependency verification...', 'info');
    
    // Check root directory
    const rootPackage = await this.checkPackageJson(this.rootDir, 'Root');
    if (rootPackage) {
      await this.checkNodeModules(this.rootDir, 'Root');
      await this.checkCriticalDependencies(
        this.rootDir, 
        rootPackage, 
        ['express', 'mongoose', 'cors']
      );
    }

    // Check client directory
    const clientPackage = await this.checkPackageJson(this.clientDir, 'Client');
    if (clientPackage) {
      const hasClientNodeModules = await this.checkNodeModules(this.clientDir, 'Client');
      
      if (!hasClientNodeModules) {
        this.log('Client dependencies missing, attempting to install...');
        await this.installMissingDependencies(this.clientDir, 'Client');
      }
      
      await this.checkCriticalDependencies(
        this.clientDir, 
        clientPackage, 
        ['react', 'react-dom', 'react-scripts']
      );
    }

    // Verify react-scripts specifically
    await this.verifyReactScripts();

    // Test build command
    await this.testBuildCommand();

    // Report results
    this.log('\n=== Dependency Verification Report ===');
    
    if (this.errors.length === 0) {
      this.log('All dependency checks passed!', 'success');
    } else {
      this.log(`Found ${this.errors.length} error(s):`, 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log(`Found ${this.warnings.length} warning(s):`, 'warn');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warn'));
    }

    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1);
    } else {
      this.log('Dependency verification completed successfully!', 'success');
      process.exit(0);
    }
  }
}

// Run the verifier
const verifier = new DependencyVerifier();
verifier.run().catch(error => {
  console.error('❌ Dependency verification failed:', error);
  process.exit(1);
});