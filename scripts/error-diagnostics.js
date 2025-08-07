#!/usr/bin/env node

/**
 * 錯誤診斷工具
 * 分析構建錯誤並提供具體的修復建議
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ErrorDiagnostics {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.logDir = path.join(this.rootDir, 'logs');
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

  async analyzeEnvironment() {
    this.log('Analyzing environment...');
    
    const analysis = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        CI: process.env.CI,
        ZEABUR: process.env.ZEABUR
      }
    };

    // Check Node.js version
    const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
    if (nodeVersion < 16) {
      analysis.issues = analysis.issues || [];
      analysis.issues.push({
        type: 'environment',
        severity: 'error',
        message: `Node.js version ${process.version} is too old. Requires Node.js 16+`,
        solution: 'Upgrade Node.js to version 16 or higher'
      });
    }

    return analysis;
  }

  async analyzeFileStructure() {
    this.log('Analyzing file structure...');
    
    const requiredFiles = [
      { path: 'package.json', type: 'root' },
      { path: 'client/package.json', type: 'client' },
      { path: 'server/index.js', type: 'server' }
    ];

    const analysis = {
      missingFiles: [],
      existingFiles: []
    };

    for (const file of requiredFiles) {
      const fullPath = path.join(this.rootDir, file.path);
      if (fs.existsSync(fullPath)) {
        analysis.existingFiles.push(file);
      } else {
        analysis.missingFiles.push(file);
      }
    }

    return analysis;
  }

  async analyzeDependencies() {
    this.log('Analyzing dependencies...');
    
    const analysis = {
      root: { exists: false, issues: [] },
      client: { exists: false, issues: [] }
    };

    // Analyze root dependencies
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    const rootNodeModulesPath = path.join(this.rootDir, 'node_modules');
    
    if (fs.existsSync(rootPackagePath)) {
      analysis.root.exists = true;
      const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      
      if (!fs.existsSync(rootNodeModulesPath)) {
        analysis.root.issues.push({
          type: 'missing_installation',
          message: 'Root node_modules directory not found',
          solution: 'Run: npm install'
        });
      }

      // Check critical dependencies
      const criticalDeps = ['express', 'mongoose', 'cors'];
      for (const dep of criticalDeps) {
        if (!rootPackage.dependencies || !rootPackage.dependencies[dep]) {
          analysis.root.issues.push({
            type: 'missing_dependency',
            message: `Critical dependency '${dep}' not found in package.json`,
            solution: `Run: npm install ${dep}`
          });
        }
      }
    }

    // Analyze client dependencies
    const clientPackagePath = path.join(this.clientDir, 'package.json');
    const clientNodeModulesPath = path.join(this.clientDir, 'node_modules');
    
    if (fs.existsSync(clientPackagePath)) {
      analysis.client.exists = true;
      const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
      
      if (!fs.existsSync(clientNodeModulesPath)) {
        analysis.client.issues.push({
          type: 'missing_installation',
          message: 'Client node_modules directory not found',
          solution: 'Run: cd client && npm install'
        });
      }

      // Check react-scripts specifically
      if (!clientPackage.dependencies || !clientPackage.dependencies['react-scripts']) {
        analysis.client.issues.push({
          type: 'missing_dependency',
          message: 'react-scripts not found in client package.json',
          solution: 'Run: cd client && npm install react-scripts'
        });
      } else {
        const reactScriptsPath = path.join(clientNodeModulesPath, 'react-scripts');
        if (!fs.existsSync(reactScriptsPath)) {
          analysis.client.issues.push({
            type: 'missing_installation',
            message: 'react-scripts not installed in client node_modules',
            solution: 'Run: cd client && npm install'
          });
        }
      }
    }

    return analysis;
  }

  async analyzeBuildConfiguration() {
    this.log('Analyzing build configuration...');
    
    const analysis = {
      scripts: { valid: true, issues: [] },
      environment: { valid: true, issues: [] }
    };

    // Check package.json scripts
    const rootPackagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      const scripts = rootPackage.scripts || {};

      const requiredScripts = [
        'build',
        'build:client',
        'install:client'
      ];

      for (const script of requiredScripts) {
        if (!scripts[script]) {
          analysis.scripts.valid = false;
          analysis.scripts.issues.push({
            type: 'missing_script',
            message: `Missing script: ${script}`,
            solution: `Add "${script}" script to package.json`
          });
        }
      }
    }

    return analysis;
  }

  async runDiagnostics() {
    this.log('Starting comprehensive error diagnostics...', 'info');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: await this.analyzeEnvironment(),
      fileStructure: await this.analyzeFileStructure(),
      dependencies: await this.analyzeDependencies(),
      buildConfiguration: await this.analyzeBuildConfiguration()
    };

    // Collect all issues
    const allIssues = [];
    
    if (diagnostics.environment.issues) {
      allIssues.push(...diagnostics.environment.issues);
    }
    
    if (diagnostics.fileStructure.missingFiles.length > 0) {
      allIssues.push({
        type: 'file_structure',
        severity: 'error',
        message: `Missing files: ${diagnostics.fileStructure.missingFiles.map(f => f.path).join(', ')}`,
        solution: 'Ensure all required files exist in the project'
      });
    }
    
    allIssues.push(...diagnostics.dependencies.root.issues);
    allIssues.push(...diagnostics.dependencies.client.issues);
    allIssues.push(...diagnostics.buildConfiguration.scripts.issues);

    // Generate report
    this.log('\n=== Error Diagnostics Report ===');
    
    if (allIssues.length === 0) {
      this.log('No issues detected! Your project configuration looks good.', 'success');
    } else {
      this.log(`Found ${allIssues.length} issue(s):`, 'error');
      
      allIssues.forEach((issue, index) => {
        this.log(`\n${index + 1}. ${issue.message}`, 'error');
        this.log(`   Solution: ${issue.solution}`, 'fix');
      });

      // Provide quick fix commands
      this.log('\n=== Quick Fix Commands ===', 'fix');
      this.log('Try running these commands to fix common issues:', 'fix');
      this.log('1. npm run fix:deps', 'fix');
      this.log('2. npm run install:all', 'fix');
      this.log('3. npm run verify:deps', 'fix');
    }

    // Save diagnostics report
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    const reportPath = path.join(this.logDir, `diagnostics-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));
    
    this.log(`\nDiagnostics report saved to: ${reportPath}`, 'info');
    
    return allIssues.length === 0;
  }
}

// Run if called directly
if (require.main === module) {
  const diagnostics = new ErrorDiagnostics();
  diagnostics.runDiagnostics().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error diagnostics failed:', error);
    process.exit(1);
  });
}

module.exports = ErrorDiagnostics;