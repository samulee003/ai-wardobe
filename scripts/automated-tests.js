#!/usr/bin/env node

/**
 * 自動化測試腳本
 * 驗證構建結果的功能性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutomatedTests {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.buildDir = path.join(this.clientDir, 'build');
    this.testResults = [];
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

  addTestResult(name, passed, details = null, duration = 0) {
    this.testResults.push({
      name,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  async testBuildArtifacts() {
    this.log('Testing build artifacts...', 'test');
    
    const startTime = Date.now();
    let allPassed = true;

    // Test 1: Build directory exists
    const buildExists = fs.existsSync(this.buildDir);
    this.addTestResult('Build directory exists', buildExists, 
      buildExists ? 'Found' : 'Missing');
    if (!buildExists) allPassed = false;

    if (buildExists) {
      // Test 2: index.html exists and is valid
      const indexPath = path.join(this.buildDir, 'index.html');
      const indexExists = fs.existsSync(indexPath);
      this.addTestResult('index.html exists', indexExists);
      
      if (indexExists) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const hasTitle = indexContent.includes('<title>');
        const hasRoot = indexContent.includes('id="root"') || indexContent.includes('id="app"');
        const hasScripts = indexContent.includes('<script');
        
        this.addTestResult('index.html has title', hasTitle);
        this.addTestResult('index.html has root element', hasRoot);
        this.addTestResult('index.html has scripts', hasScripts);
        
        if (!hasTitle || !hasRoot || !hasScripts) allPassed = false;
      } else {
        allPassed = false;
      }

      // Test 3: Static assets exist
      const staticDir = path.join(this.buildDir, 'static');
      const staticExists = fs.existsSync(staticDir);
      this.addTestResult('Static directory exists', staticExists);
      
      if (staticExists) {
        const jsDir = path.join(staticDir, 'js');
        const cssDir = path.join(staticDir, 'css');
        
        const hasJS = fs.existsSync(jsDir) && fs.readdirSync(jsDir).some(f => f.endsWith('.js'));
        const hasCSS = fs.existsSync(cssDir) && fs.readdirSync(cssDir).some(f => f.endsWith('.css'));
        
        this.addTestResult('JavaScript files exist', hasJS);
        this.addTestResult('CSS files exist', hasCSS);
        
        if (!hasJS || !hasCSS) allPassed = false;
      } else {
        allPassed = false;
      }

      // Test 4: Manifest and other PWA files
      const manifestPath = path.join(this.buildDir, 'manifest.json');
      const manifestExists = fs.existsSync(manifestPath);
      this.addTestResult('PWA manifest exists', manifestExists);

      // Test 5: File sizes are reasonable
      const buildStats = this.calculateBuildStats();
      const reasonableSize = buildStats.totalSize < 50 * 1024 * 1024; // 50MB
      this.addTestResult('Build size is reasonable', reasonableSize, 
        `${(buildStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      if (!reasonableSize) allPassed = false;
    }

    const duration = Date.now() - startTime;
    this.log(`Build artifacts test completed in ${duration}ms`, allPassed ? 'success' : 'error');
    
    return allPassed;
  }

  async testServerConfiguration() {
    this.log('Testing server configuration...', 'test');
    
    const startTime = Date.now();
    let allPassed = true;

    // Test 1: Server entry point exists
    const serverPath = path.join(this.rootDir, 'server', 'index.js');
    const serverExists = fs.existsSync(serverPath);
    this.addTestResult('Server entry point exists', serverExists);
    if (!serverExists) allPassed = false;

    // Test 2: Package.json has correct start script
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasStartScript = packageJson.scripts && packageJson.scripts.start;
      const correctStartScript = hasStartScript && packageJson.scripts.start.includes('server/index.js');
      
      this.addTestResult('Start script exists', hasStartScript);
      this.addTestResult('Start script is correct', correctStartScript, 
        hasStartScript ? packageJson.scripts.start : 'Missing');
      
      if (!hasStartScript || !correctStartScript) allPassed = false;
    }

    // Test 3: Health check endpoint (if server can start)
    try {
      // Try to validate server syntax without starting it
      execSync('node -c server/index.js', { 
        cwd: this.rootDir, 
        stdio: 'pipe',
        timeout: 10000
      });
      this.addTestResult('Server syntax is valid', true);
    } catch (error) {
      this.addTestResult('Server syntax is valid', false, error.message);
      allPassed = false;
    }

    const duration = Date.now() - startTime;
    this.log(`Server configuration test completed in ${duration}ms`, allPassed ? 'success' : 'error');
    
    return allPassed;
  }

  async testDependencyIntegrity() {
    this.log('Testing dependency integrity...', 'test');
    
    const startTime = Date.now();
    let allPassed = true;

    // Test 1: No missing dependencies
    try {
      execSync('npm ls --depth=0', { 
        cwd: this.rootDir, 
        stdio: 'pipe',
        timeout: 30000
      });
      this.addTestResult('Root dependencies integrity', true);
    } catch (error) {
      this.addTestResult('Root dependencies integrity', false, 'Missing dependencies detected');
      allPassed = false;
    }

    try {
      execSync('npm ls --depth=0', { 
        cwd: this.clientDir, 
        stdio: 'pipe',
        timeout: 30000
      });
      this.addTestResult('Client dependencies integrity', true);
    } catch (error) {
      this.addTestResult('Client dependencies integrity', false, 'Missing dependencies detected');
      allPassed = false;
    }

    // Test 2: Critical dependencies are accessible
    const criticalDeps = [
      { name: 'react-scripts', path: path.join(this.clientDir, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js') },
      { name: 'express', path: path.join(this.rootDir, 'node_modules', 'express', 'index.js') }
    ];

    for (const dep of criticalDeps) {
      const accessible = fs.existsSync(dep.path);
      this.addTestResult(`${dep.name} is accessible`, accessible, dep.path);
      if (!accessible) allPassed = false;
    }

    const duration = Date.now() - startTime;
    this.log(`Dependency integrity test completed in ${duration}ms`, allPassed ? 'success' : 'error');
    
    return allPassed;
  }

  async testBuildReproducibility() {
    this.log('Testing build reproducibility...', 'test');
    
    const startTime = Date.now();
    let allPassed = true;

    try {
      // Build once
      if (fs.existsSync(this.buildDir)) {
        fs.rmSync(this.buildDir, { recursive: true, force: true });
      }
      
      execSync('npm run build:client', { 
        cwd: this.rootDir,
        stdio: 'pipe',
        timeout: 300000
      });

      const firstBuildStats = this.calculateBuildStats();
      
      // Build again
      fs.rmSync(this.buildDir, { recursive: true, force: true });
      
      execSync('npm run build:client', { 
        cwd: this.rootDir,
        stdio: 'pipe',
        timeout: 300000
      });

      const secondBuildStats = this.calculateBuildStats();
      
      // Compare builds
      const sizeMatch = Math.abs(firstBuildStats.totalSize - secondBuildStats.totalSize) < 1024; // 1KB tolerance
      const fileCountMatch = firstBuildStats.fileCount === secondBuildStats.fileCount;
      
      this.addTestResult('Build size consistency', sizeMatch, 
        `First: ${firstBuildStats.totalSize}, Second: ${secondBuildStats.totalSize}`);
      this.addTestResult('Build file count consistency', fileCountMatch,
        `First: ${firstBuildStats.fileCount}, Second: ${secondBuildStats.fileCount}`);
      
      if (!sizeMatch || !fileCountMatch) allPassed = false;
      
    } catch (error) {
      this.addTestResult('Build reproducibility', false, error.message);
      allPassed = false;
    }

    const duration = Date.now() - startTime;
    this.log(`Build reproducibility test completed in ${duration}ms`, allPassed ? 'success' : 'error');
    
    return allPassed;
  }

  calculateBuildStats() {
    let totalSize = 0;
    let fileCount = 0;

    const calculateDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateDir(itemPath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };

    calculateDir(this.buildDir);
    return { totalSize, fileCount };
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      testResults: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(t => t.passed).length,
        failed: this.testResults.filter(t => !t.passed).length,
        success: this.testResults.every(t => t.passed),
        totalDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0)
      }
    };

    // Save report
    const logDir = path.join(this.rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const reportPath = path.join(logDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Test report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  async run() {
    this.log('Starting automated tests...', 'info');
    
    const results = {
      buildArtifacts: await this.testBuildArtifacts(),
      serverConfiguration: await this.testServerConfiguration(),
      dependencyIntegrity: await this.testDependencyIntegrity(),
      buildReproducibility: await this.testBuildReproducibility()
    };

    const overallSuccess = Object.values(results).every(result => result);
    
    // Generate report
    const report = await this.generateTestReport();
    
    // Summary
    this.log('\n=== Automated Test Summary ===');
    this.log(`Build Artifacts: ${results.buildArtifacts ? 'PASS' : 'FAIL'}`, results.buildArtifacts ? 'success' : 'error');
    this.log(`Server Configuration: ${results.serverConfiguration ? 'PASS' : 'FAIL'}`, results.serverConfiguration ? 'success' : 'error');
    this.log(`Dependency Integrity: ${results.dependencyIntegrity ? 'PASS' : 'FAIL'}`, results.dependencyIntegrity ? 'success' : 'error');
    this.log(`Build Reproducibility: ${results.buildReproducibility ? 'PASS' : 'FAIL'}`, results.buildReproducibility ? 'success' : 'error');
    
    this.log(`\nOverall Result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
             overallSuccess ? 'success' : 'error');

    if (!overallSuccess) {
      this.log('\nFailed tests:', 'error');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => this.log(`  - ${t.name}: ${t.details || 'Failed'}`, 'error'));
    }

    return overallSuccess;
  }
}

// Run if called directly
if (require.main === module) {
  const tests = new AutomatedTests();
  tests.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Automated tests failed:', error);
    process.exit(1);
  });
}

module.exports = AutomatedTests;