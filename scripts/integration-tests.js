#!/usr/bin/env node

/**
 * 構建過程集成測試
 * 完整測試構建流程和多平台兼容性
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class IntegrationTests {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.testResults = [];
    this.testSuites = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      test: '🧪',
      suite: '📋'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTestResult(suiteName, testName, passed, details = null, duration = 0) {
    this.testResults.push({
      suite: suiteName,
      test: testName,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  async runTestSuite(suiteName, tests) {
    this.log(`Running test suite: ${suiteName}`, 'suite');
    
    const suiteStartTime = Date.now();
    let suitePassed = true;
    const suiteResults = [];

    for (const test of tests) {
      const testStartTime = Date.now();
      
      try {
        this.log(`  Running: ${test.name}`, 'test');
        const result = await test.fn();
        const testDuration = Date.now() - testStartTime;
        
        this.addTestResult(suiteName, test.name, result.passed, result.details, testDuration);
        suiteResults.push({ name: test.name, passed: result.passed, duration: testDuration });
        
        if (!result.passed) {
          suitePassed = false;
          this.log(`  ❌ ${test.name}: ${result.details || 'Failed'}`, 'error');
        } else {
          this.log(`  ✅ ${test.name} (${testDuration}ms)`, 'success');
        }
        
      } catch (error) {
        const testDuration = Date.now() - testStartTime;
        this.addTestResult(suiteName, test.name, false, error.message, testDuration);
        suiteResults.push({ name: test.name, passed: false, duration: testDuration });
        suitePassed = false;
        this.log(`  ❌ ${test.name}: ${error.message}`, 'error');
      }
    }

    const suiteDuration = Date.now() - suiteStartTime;
    const passedTests = suiteResults.filter(r => r.passed).length;
    
    this.testSuites.push({
      name: suiteName,
      passed: suitePassed,
      duration: suiteDuration,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests
    });

    this.log(`Suite ${suiteName}: ${passedTests}/${tests.length} passed (${suiteDuration}ms)`, 
             suitePassed ? 'success' : 'error');
    
    return suitePassed;
  }

  async testFullBuildPipeline() {
    return await this.runTestSuite('Full Build Pipeline', [
      {
        name: 'Clean environment',
        fn: async () => {
          const buildDir = path.join(this.clientDir, 'build');
          if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
          }
          return { passed: true, details: 'Environment cleaned' };
        }
      },
      {
        name: 'Install dependencies',
        fn: async () => {
          try {
            execSync('npm run install:all', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 300000
            });
            return { passed: true, details: 'Dependencies installed' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Verify dependencies',
        fn: async () => {
          try {
            execSync('npm run verify:deps', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 60000
            });
            return { passed: true, details: 'Dependencies verified' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Build client application',
        fn: async () => {
          try {
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000,
              env: { ...process.env, GENERATE_SOURCEMAP: 'false' }
            });
            
            const buildDir = path.join(this.clientDir, 'build');
            const indexExists = fs.existsSync(path.join(buildDir, 'index.html'));
            
            if (!indexExists) {
              return { passed: false, details: 'Build output missing index.html' };
            }
            
            return { passed: true, details: 'Client built successfully' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Validate build output',
        fn: async () => {
          try {
            execSync('npm run validate', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 120000
            });
            return { passed: true, details: 'Build output validated' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      }
    ]);
  }

  async testMultipleBuildRuns() {
    return await this.runTestSuite('Multiple Build Runs', [
      {
        name: 'First build run',
        fn: async () => {
          try {
            const buildDir = path.join(this.clientDir, 'build');
            if (fs.existsSync(buildDir)) {
              fs.rmSync(buildDir, { recursive: true, force: true });
            }
            
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000
            });
            
            return { passed: true, details: 'First build completed' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Second build run (incremental)',
        fn: async () => {
          try {
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000
            });
            
            return { passed: true, details: 'Second build completed' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Build consistency check',
        fn: async () => {
          const buildDir = path.join(this.clientDir, 'build');
          const indexPath = path.join(buildDir, 'index.html');
          
          if (!fs.existsSync(indexPath)) {
            return { passed: false, details: 'Build output inconsistent' };
          }
          
          const indexContent = fs.readFileSync(indexPath, 'utf8');
          const hasValidContent = indexContent.includes('<div id="root">') || 
                                 indexContent.includes('<div id="app">');
          
          return { 
            passed: hasValidContent, 
            details: hasValidContent ? 'Build consistent' : 'Invalid build content' 
          };
        }
      }
    ]);
  }

  async testErrorRecovery() {
    return await this.runTestSuite('Error Recovery', [
      {
        name: 'Simulate build failure',
        fn: async () => {
          // Temporarily corrupt package.json to simulate failure
          const clientPackagePath = path.join(this.clientDir, 'package.json');
          const originalContent = fs.readFileSync(clientPackagePath, 'utf8');
          
          try {
            // Create backup
            fs.writeFileSync(clientPackagePath + '.backup', originalContent);
            
            // Corrupt the file
            fs.writeFileSync(clientPackagePath, '{ invalid json }');
            
            // Try to build (should fail)
            try {
              execSync('npm run build:client', { 
                cwd: this.rootDir, 
                stdio: 'pipe',
                timeout: 60000
              });
              return { passed: false, details: 'Build should have failed but succeeded' };
            } catch (error) {
              // Expected failure
              return { passed: true, details: 'Build failed as expected' };
            }
          } finally {
            // Restore original file
            if (fs.existsSync(clientPackagePath + '.backup')) {
              fs.copyFileSync(clientPackagePath + '.backup', clientPackagePath);
              fs.unlinkSync(clientPackagePath + '.backup');
            }
          }
        }
      },
      {
        name: 'Test dependency fixer',
        fn: async () => {
          try {
            execSync('npm run fix:deps', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 300000
            });
            return { passed: true, details: 'Dependency fixer completed' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Recovery build',
        fn: async () => {
          try {
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000
            });
            return { passed: true, details: 'Recovery build successful' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      }
    ]);
  }

  async testPlatformCompatibility() {
    return await this.runTestSuite('Platform Compatibility', [
      {
        name: 'Platform detection',
        fn: async () => {
          try {
            const output = execSync('npm run platform:detect', { 
              cwd: this.rootDir, 
              encoding: 'utf8',
              timeout: 30000
            });
            
            const hasValidPlatform = output.includes('Detected platform:');
            return { 
              passed: hasValidPlatform, 
              details: hasValidPlatform ? 'Platform detected' : 'Platform detection failed' 
            };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Local platform build',
        fn: async () => {
          try {
            // Set local environment
            const env = { ...process.env, CI: undefined, ZEABUR: undefined };
            
            execSync('npm run platform:build', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000,
              env
            });
            
            return { passed: true, details: 'Local platform build successful' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'CI environment simulation',
        fn: async () => {
          try {
            // Simulate CI environment
            const env = { ...process.env, CI: 'true' };
            
            execSync('npm run platform:build', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000,
              env
            });
            
            return { passed: true, details: 'CI environment build successful' };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      }
    ]);
  }

  async testPerformanceBenchmarks() {
    return await this.runTestSuite('Performance Benchmarks', [
      {
        name: 'Build time benchmark',
        fn: async () => {
          const buildDir = path.join(this.clientDir, 'build');
          if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
          }
          
          const startTime = Date.now();
          
          try {
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000
            });
            
            const buildTime = Date.now() - startTime;
            const acceptable = buildTime < 300000; // 5 minutes
            
            return { 
              passed: acceptable, 
              details: `Build time: ${buildTime}ms (${acceptable ? 'acceptable' : 'too slow'})` 
            };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      },
      {
        name: 'Build size check',
        fn: async () => {
          const buildDir = path.join(this.clientDir, 'build');
          
          if (!fs.existsSync(buildDir)) {
            return { passed: false, details: 'Build directory not found' };
          }
          
          const buildSize = this.calculateDirectorySize(buildDir);
          const acceptable = buildSize < 50 * 1024 * 1024; // 50MB
          
          return { 
            passed: acceptable, 
            details: `Build size: ${(buildSize / 1024 / 1024).toFixed(2)}MB (${acceptable ? 'acceptable' : 'too large'})` 
          };
        }
      },
      {
        name: 'Memory usage check',
        fn: async () => {
          const initialMemory = process.memoryUsage().heapUsed;
          
          try {
            execSync('npm run build:client', { 
              cwd: this.rootDir, 
              stdio: 'pipe',
              timeout: 600000
            });
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            const acceptable = memoryIncrease < 500 * 1024 * 1024; // 500MB increase
            
            return { 
              passed: acceptable, 
              details: `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${acceptable ? 'acceptable' : 'too high'})` 
            };
          } catch (error) {
            return { passed: false, details: error.message };
          }
        }
      }
    ]);
  }

  calculateDirectorySize(dir) {
    let totalSize = 0;
    
    const calculateDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateDir(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };
    
    calculateDir(dir);
    return totalSize;
  }

  async generateIntegrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      testSuites: this.testSuites,
      testResults: this.testResults,
      summary: {
        totalSuites: this.testSuites.length,
        passedSuites: this.testSuites.filter(s => s.passed).length,
        failedSuites: this.testSuites.filter(s => !s.passed).length,
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(t => t.passed).length,
        failedTests: this.testResults.filter(t => !t.passed).length,
        totalDuration: this.testSuites.reduce((sum, s) => sum + s.duration, 0),
        success: this.testSuites.every(s => s.passed)
      }
    };

    // Save report
    const logDir = path.join(this.rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const reportPath = path.join(logDir, `integration-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Integration test report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  async run() {
    this.log('Starting integration tests...', 'info');
    
    const suiteResults = {
      fullBuildPipeline: await this.testFullBuildPipeline(),
      multipleBuildRuns: await this.testMultipleBuildRuns(),
      errorRecovery: await this.testErrorRecovery(),
      platformCompatibility: await this.testPlatformCompatibility(),
      performanceBenchmarks: await this.testPerformanceBenchmarks()
    };

    const overallSuccess = Object.values(suiteResults).every(result => result);
    
    // Generate report
    const report = await this.generateIntegrationReport();
    
    // Summary
    this.log('\n=== Integration Test Summary ===');
    Object.entries(suiteResults).forEach(([suite, passed]) => {
      this.log(`${suite}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error');
    });
    
    this.log(`\nOverall Result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
             overallSuccess ? 'success' : 'error');

    if (!overallSuccess) {
      this.log('\nFailed tests:', 'error');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => this.log(`  - ${t.suite}/${t.test}: ${t.details || 'Failed'}`, 'error'));
    }

    this.log(`\nTotal duration: ${report.summary.totalDuration}ms`, 'info');
    this.log(`Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`, 'info');

    return overallSuccess;
  }
}

// Run if called directly
if (require.main === module) {
  const tests = new IntegrationTests();
  tests.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTests;