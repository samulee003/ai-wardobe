#!/usr/bin/env node

/**
 * 構建監控和診斷系統
 * 監控構建過程並提供詳細的錯誤診斷
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class BuildMonitor {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.logDir = path.join(this.rootDir, 'logs');
    this.buildLog = [];
    this.startTime = Date.now();
    this.stages = [];
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, type = 'info', stage = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    
    const logEntry = {
      timestamp,
      elapsed,
      type,
      stage,
      message
    };
    
    this.buildLog.push(logEntry);
    
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      stage: '🔄'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${elapsed}ms] ${stage ? `[${stage}] ` : ''}${message}`);
  }

  startStage(name) {
    const stage = {
      name,
      startTime: Date.now(),
      endTime: null,
      success: null,
      errors: [],
      warnings: []
    };
    
    this.stages.push(stage);
    this.log(`Starting stage: ${name}`, 'stage', name);
    return stage;
  }

  endStage(stage, success = true) {
    stage.endTime = Date.now();
    stage.success = success;
    
    const duration = stage.endTime - stage.startTime;
    const status = success ? 'completed' : 'failed';
    
    this.log(`Stage ${stage.name} ${status} in ${duration}ms`, success ? 'success' : 'error', stage.name);
  }

  async runCommand(command, options = {}) {
    const stage = options.stage || 'command';
    
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${command}`, 'info', stage);
      
      const child = spawn('sh', ['-c', command], {
        cwd: options.cwd || this.rootDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Log important output
        if (output.includes('error') || output.includes('warning') || options.verbose) {
          this.log(output.trim(), 'info', stage);
        }
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        this.log(output.trim(), 'warn', stage);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async diagnoseError(error, stage) {
    this.log(`Diagnosing error in stage: ${stage}`, 'error');
    
    const diagnosis = {
      stage,
      error: error.message,
      possibleCauses: [],
      solutions: []
    };

    // Common error patterns and solutions
    const errorPatterns = [
      {
        pattern: /react-scripts.*not found/i,
        cause: 'react-scripts dependency missing',
        solutions: [
          'Run: cd client && npm install react-scripts',
          'Check if client/package.json contains react-scripts dependency',
          'Try: npm run fix:deps'
        ]
      },
      {
        pattern: /ENOENT.*package\.json/i,
        cause: 'package.json file missing',
        solutions: [
          'Ensure package.json exists in the correct directory',
          'Check if you are in the correct working directory'
        ]
      },
      {
        pattern: /npm.*EACCES/i,
        cause: 'Permission denied during npm operation',
        solutions: [
          'Check file permissions',
          'Try running with appropriate permissions',
          'Clear npm cache: npm cache clean --force'
        ]
      },
      {
        pattern: /Module not found/i,
        cause: 'Missing dependency or incorrect import',
        solutions: [
          'Install missing dependencies: npm install',
          'Check import paths in your code',
          'Verify dependency versions in package.json'
        ]
      },
      {
        pattern: /JavaScript heap out of memory/i,
        cause: 'Insufficient memory for build process',
        solutions: [
          'Increase Node.js memory limit: export NODE_OPTIONS="--max-old-space-size=4096"',
          'Close other applications to free memory',
          'Consider building on a machine with more RAM'
        ]
      }
    ];

    for (const pattern of errorPatterns) {
      if (pattern.pattern.test(error.message)) {
        diagnosis.possibleCauses.push(pattern.cause);
        diagnosis.solutions.push(...pattern.solutions);
      }
    }

    // Generic solutions if no specific pattern matched
    if (diagnosis.solutions.length === 0) {
      diagnosis.solutions = [
        'Check the full error message above for specific details',
        'Ensure all dependencies are installed: npm run install:all',
        'Try cleaning and reinstalling: rm -rf node_modules client/node_modules && npm run install:all',
        'Check Node.js version compatibility (requires Node.js 16+)'
      ];
    }

    this.log('Error diagnosis:', 'error');
    this.log(`Possible causes: ${diagnosis.possibleCauses.join(', ')}`, 'error');
    this.log('Suggested solutions:', 'error');
    diagnosis.solutions.forEach((solution, index) => {
      this.log(`  ${index + 1}. ${solution}`, 'error');
    });

    return diagnosis;
  }

  async generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      success: this.stages.every(stage => stage.success),
      stages: this.stages,
      buildLog: this.buildLog,
      summary: {
        totalStages: this.stages.length,
        successfulStages: this.stages.filter(s => s.success).length,
        failedStages: this.stages.filter(s => s.success === false).length,
        warnings: this.buildLog.filter(entry => entry.type === 'warn').length,
        errors: this.buildLog.filter(entry => entry.type === 'error').length
      }
    };

    // Save detailed report
    const reportPath = path.join(this.logDir, `build-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save latest report
    const latestReportPath = path.join(this.logDir, 'latest-build-report.json');
    fs.writeFileSync(latestReportPath, JSON.stringify(report, null, 2));

    this.log(`Build report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  async monitorBuild() {
    this.log('Starting build monitoring...', 'info');
    
    try {
      // Stage 1: Environment Check
      const envStage = this.startStage('Environment Check');
      try {
        await this.runCommand('node --version', { stage: 'Environment Check' });
        await this.runCommand('npm --version', { stage: 'Environment Check' });
        this.endStage(envStage, true);
      } catch (error) {
        this.endStage(envStage, false);
        await this.diagnoseError(error, 'Environment Check');
        throw error;
      }

      // Stage 2: Dependency Installation
      const depsStage = this.startStage('Dependency Installation');
      try {
        await this.runCommand('npm run install:all', { 
          stage: 'Dependency Installation',
          verbose: true 
        });
        this.endStage(depsStage, true);
      } catch (error) {
        this.endStage(depsStage, false);
        await this.diagnoseError(error, 'Dependency Installation');
        throw error;
      }

      // Stage 3: Dependency Verification
      const verifyStage = this.startStage('Dependency Verification');
      try {
        await this.runCommand('npm run verify:deps', { 
          stage: 'Dependency Verification' 
        });
        this.endStage(verifyStage, true);
      } catch (error) {
        this.endStage(verifyStage, false);
        await this.diagnoseError(error, 'Dependency Verification');
        // Try to fix dependencies automatically
        try {
          this.log('Attempting automatic dependency fix...', 'info', 'Dependency Verification');
          await this.runCommand('npm run fix:deps', { 
            stage: 'Dependency Verification' 
          });
        } catch (fixError) {
          throw error; // Throw original error if fix fails
        }
      }

      // Stage 4: Build Process
      const buildStage = this.startStage('Build Process');
      try {
        await this.runCommand('npm run build:client', { 
          stage: 'Build Process',
          verbose: true,
          env: {
            GENERATE_SOURCEMAP: 'false',
            CI: 'false'
          }
        });
        this.endStage(buildStage, true);
      } catch (error) {
        this.endStage(buildStage, false);
        await this.diagnoseError(error, 'Build Process');
        throw error;
      }

      this.log('Build monitoring completed successfully!', 'success');
      return true;

    } catch (error) {
      this.log(`Build monitoring failed: ${error.message}`, 'error');
      return false;
    } finally {
      await this.generateReport();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new BuildMonitor();
  monitor.monitorBuild().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Build monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = BuildMonitor;