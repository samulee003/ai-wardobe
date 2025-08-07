#!/usr/bin/env node

/**
 * 構建驗證腳本
 * 確保本地和生產環境構建一致性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class BuildValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.buildDir = path.join(this.clientDir, 'build');
    this.validationResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      test: '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addValidation(name, result, details = null) {
    this.validationResults.push({
      name,
      result,
      details,
      timestamp: new Date().toISOString()
    });
  }

  async validateEnvironment() {
    this.log('Validating environment...', 'test');
    
    const validations = [];

    // Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    const nodeValid = nodeMajor >= 16;
    
    validations.push({
      name: 'Node.js Version',
      result: nodeValid,
      details: `${nodeVersion} (requires 16+)`
    });

    // npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      validations.push({
        name: 'npm Version',
        result: true,
        details: npmVersion
      });
    } catch (error) {
      validations.push({
        name: 'npm Version',
        result: false,
        details: 'npm not found'
      });
    }

    // Working directory
    const correctDir = fs.existsSync(path.join(this.rootDir, 'package.json')) && 
                      fs.existsSync(path.join(this.clientDir, 'package.json'));
    
    validations.push({
      name: 'Working Directory',
      result: correctDir,
      details: this.rootDir
    });

    validations.forEach(v => this.addValidation(v.name, v.result, v.details));
    
    const allValid = validations.every(v => v.result);
    this.log(`Environment validation: ${allValid ? 'PASSED' : 'FAILED'}`, allValid ? 'success' : 'error');
    
    return allValid;
  }

  async validateDependencies() {
    this.log('Validating dependencies...', 'test');
    
    const validations = [];

    // Root package.json
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    const rootPackageExists = fs.existsSync(rootPackagePath);
    validations.push({
      name: 'Root package.json',
      result: rootPackageExists,
      details: rootPackageExists ? 'Found' : 'Missing'
    });

    // Client package.json
    const clientPackagePath = path.join(this.clientDir, 'package.json');
    const clientPackageExists = fs.existsSync(clientPackagePath);
    validations.push({
      name: 'Client package.json',
      result: clientPackageExists,
      details: clientPackageExists ? 'Found' : 'Missing'
    });

    // Root node_modules
    const rootNodeModules = fs.existsSync(path.join(this.rootDir, 'node_modules'));
    validations.push({
      name: 'Root node_modules',
      result: rootNodeModules,
      details: rootNodeModules ? 'Installed' : 'Missing'
    });

    // Client node_modules
    const clientNodeModules = fs.existsSync(path.join(this.clientDir, 'node_modules'));
    validations.push({
      name: 'Client node_modules',
      result: clientNodeModules,
      details: clientNodeModules ? 'Installed' : 'Missing'
    });

    // react-scripts
    const reactScriptsPath = path.join(this.clientDir, 'node_modules', 'react-scripts');
    const reactScriptsExists = fs.existsSync(reactScriptsPath);
    validations.push({
      name: 'react-scripts',
      result: reactScriptsExists,
      details: reactScriptsExists ? 'Available' : 'Missing'
    });

    // Critical dependencies
    if (clientPackageExists) {
      const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
      const criticalDeps = ['react', 'react-dom', 'react-scripts'];
      
      for (const dep of criticalDeps) {
        const hasDepInPackage = clientPackage.dependencies && clientPackage.dependencies[dep];
        const hasDepInstalled = fs.existsSync(path.join(this.clientDir, 'node_modules', dep));
        
        validations.push({
          name: `${dep} dependency`,
          result: hasDepInPackage && hasDepInstalled,
          details: hasDepInPackage ? (hasDepInstalled ? 'OK' : 'Not installed') : 'Not in package.json'
        });
      }
    }

    validations.forEach(v => this.addValidation(v.name, v.result, v.details));
    
    const allValid = validations.every(v => v.result);
    this.log(`Dependencies validation: ${allValid ? 'PASSED' : 'FAILED'}`, allValid ? 'success' : 'error');
    
    return allValid;
  }

  async validateBuildScripts() {
    this.log('Validating build scripts...', 'test');
    
    const validations = [];
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    
    if (fs.existsSync(rootPackagePath)) {
      const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      const scripts = rootPackage.scripts || {};

      const requiredScripts = {
        'build': 'Main build script',
        'build:client': 'Client build script',
        'install:client': 'Client install script'
      };

      for (const [scriptName, description] of Object.entries(requiredScripts)) {
        const hasScript = !!scripts[scriptName];
        validations.push({
          name: description,
          result: hasScript,
          details: hasScript ? scripts[scriptName] : 'Missing'
        });
      }
    }

    validations.forEach(v => this.addValidation(v.name, v.result, v.details));
    
    const allValid = validations.every(v => v.result);
    this.log(`Build scripts validation: ${allValid ? 'PASSED' : 'FAILED'}`, allValid ? 'success' : 'error');
    
    return allValid;
  }

  async performBuildTest() {
    this.log('Performing build test...', 'test');
    
    const validations = [];

    try {
      // Clean previous build
      if (fs.existsSync(this.buildDir)) {
        fs.rmSync(this.buildDir, { recursive: true, force: true });
      }

      // Run build
      const startTime = Date.now();
      execSync('npm run build:client', { 
        cwd: this.rootDir,
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
      const buildTime = Date.now() - startTime;

      validations.push({
        name: 'Build Execution',
        result: true,
        details: `Completed in ${buildTime}ms`
      });

      // Validate build output
      const buildExists = fs.existsSync(this.buildDir);
      validations.push({
        name: 'Build Directory',
        result: buildExists,
        details: buildExists ? 'Created' : 'Missing'
      });

      if (buildExists) {
        // Check for essential files
        const essentialFiles = [
          'index.html',
          'static/js',
          'static/css'
        ];

        for (const file of essentialFiles) {
          const filePath = path.join(this.buildDir, file);
          const exists = fs.existsSync(filePath);
          validations.push({
            name: `Build file: ${file}`,
            result: exists,
            details: exists ? 'Present' : 'Missing'
          });
        }

        // Check index.html content
        const indexPath = path.join(this.buildDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          const indexContent = fs.readFileSync(indexPath, 'utf8');
          const hasReactRoot = indexContent.includes('root') || indexContent.includes('app');
          validations.push({
            name: 'index.html content',
            result: hasReactRoot,
            details: hasReactRoot ? 'Valid React app' : 'Invalid content'
          });
        }

        // Calculate build size
        const buildStats = this.calculateBuildSize(this.buildDir);
        validations.push({
          name: 'Build Size',
          result: buildStats.totalSize < 50 * 1024 * 1024, // 50MB limit
          details: `${(buildStats.totalSize / 1024 / 1024).toFixed(2)}MB (${buildStats.fileCount} files)`
        });
      }

    } catch (error) {
      validations.push({
        name: 'Build Execution',
        result: false,
        details: error.message
      });
    }

    validations.forEach(v => this.addValidation(v.name, v.result, v.details));
    
    const allValid = validations.every(v => v.result);
    this.log(`Build test: ${allValid ? 'PASSED' : 'FAILED'}`, allValid ? 'success' : 'error');
    
    return allValid;
  }

  calculateBuildSize(dir) {
    let totalSize = 0;
    let fileCount = 0;

    const calculateDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateDir(itemPath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };

    if (fs.existsSync(dir)) {
      calculateDir(dir);
    }

    return { totalSize, fileCount };
  }

  async generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      validations: this.validationResults,
      summary: {
        total: this.validationResults.length,
        passed: this.validationResults.filter(v => v.result).length,
        failed: this.validationResults.filter(v => !v.result).length,
        success: this.validationResults.every(v => v.result)
      }
    };

    // Save report
    const logDir = path.join(this.rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const reportPath = path.join(logDir, `validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Validation report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  async run() {
    this.log('Starting build validation...', 'info');
    
    const results = {
      environment: await this.validateEnvironment(),
      dependencies: await this.validateDependencies(),
      buildScripts: await this.validateBuildScripts(),
      buildTest: await this.performBuildTest()
    };

    const overallSuccess = Object.values(results).every(result => result);
    
    // Generate report
    const report = await this.generateValidationReport();
    
    // Summary
    this.log('\n=== Build Validation Summary ===');
    this.log(`Environment: ${results.environment ? 'PASS' : 'FAIL'}`, results.environment ? 'success' : 'error');
    this.log(`Dependencies: ${results.dependencies ? 'PASS' : 'FAIL'}`, results.dependencies ? 'success' : 'error');
    this.log(`Build Scripts: ${results.buildScripts ? 'PASS' : 'FAIL'}`, results.buildScripts ? 'success' : 'error');
    this.log(`Build Test: ${results.buildTest ? 'PASS' : 'FAIL'}`, results.buildTest ? 'success' : 'error');
    
    this.log(`\nOverall Result: ${overallSuccess ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}`, 
             overallSuccess ? 'success' : 'error');

    if (!overallSuccess) {
      this.log('\nFailed validations:', 'error');
      this.validationResults
        .filter(v => !v.result)
        .forEach(v => this.log(`  - ${v.name}: ${v.details}`, 'error'));
    }

    return overallSuccess;
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  validator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Build validation failed:', error);
    process.exit(1);
  });
}

module.exports = BuildValidator;