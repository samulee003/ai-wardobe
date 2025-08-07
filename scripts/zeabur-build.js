#!/usr/bin/env node

/**
 * Zeabur 構建腳本
 * 專為 Zeabur 平台優化的構建流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ZeaburBuilder {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async detectPlatform() {
    // Check if running on Zeabur
    const isZeabur = process.env.ZEABUR || process.env.ZEABUR_SERVICE_ID;
    
    if (isZeabur) {
      this.log('Detected Zeabur platform', 'success');
      return 'zeabur';
    }
    
    this.log('Running on local/other platform');
    return 'local';
  }

  async setupZeaburEnvironment() {
    this.log('Setting up Zeabur environment...');
    
    // Set Node.js memory limit for Zeabur
    process.env.NODE_OPTIONS = '--max-old-space-size=1024';
    
    // Set npm configuration for Zeabur
    try {
      execSync('npm config set fund false', { stdio: 'inherit' });
      execSync('npm config set audit false', { stdio: 'inherit' });
      this.log('Zeabur environment configured', 'success');
    } catch (error) {
      this.log(`Warning: Could not configure npm: ${error.message}`, 'warn');
    }
  }

  async installDependencies() {
    this.log('Installing dependencies...');
    
    // Install root dependencies
    try {
      execSync('npm ci --only=production --no-audit --no-fund', { 
        cwd: this.rootDir,
        stdio: 'inherit',
        timeout: 300000
      });
      this.log('Root dependencies installed', 'success');
    } catch (error) {
      this.log('Root npm ci failed, trying npm install...', 'warn');
      execSync('npm install --only=production --no-audit --no-fund', { 
        cwd: this.rootDir,
        stdio: 'inherit',
        timeout: 300000
      });
    }

    // Install client dependencies
    try {
      execSync('npm ci --only=production --no-audit --no-fund', { 
        cwd: this.clientDir,
        stdio: 'inherit',
        timeout: 300000
      });
      this.log('Client dependencies installed', 'success');
    } catch (error) {
      this.log('Client npm ci failed, trying npm install...', 'warn');
      execSync('npm install --only=production --no-audit --no-fund', { 
        cwd: this.clientDir,
        stdio: 'inherit',
        timeout: 300000
      });
    }
  }

  async verifyDependencies() {
    this.log('Verifying critical dependencies...');
    
    const criticalDeps = [
      { name: 'react-scripts', path: path.join(this.clientDir, 'node_modules', 'react-scripts') },
      { name: 'react', path: path.join(this.clientDir, 'node_modules', 'react') },
      { name: 'express', path: path.join(this.rootDir, 'node_modules', 'express') }
    ];

    for (const dep of criticalDeps) {
      if (!fs.existsSync(dep.path)) {
        throw new Error(`Critical dependency ${dep.name} not found at ${dep.path}`);
      }
      this.log(`✓ ${dep.name} found`, 'success');
    }
  }

  async buildClient() {
    this.log('Building client application...');
    
    // Set build environment variables
    process.env.GENERATE_SOURCEMAP = 'false';
    process.env.CI = 'false'; // Prevent treating warnings as errors
    
    try {
      execSync('npm run build', { 
        cwd: this.clientDir,
        stdio: 'inherit',
        timeout: 600000, // 10 minutes
        env: {
          ...process.env,
          GENERATE_SOURCEMAP: 'false',
          CI: 'false'
        }
      });
      
      // Verify build output
      const buildDir = path.join(this.clientDir, 'build');
      const indexPath = path.join(buildDir, 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        throw new Error('Build failed: index.html not found in build directory');
      }
      
      this.log('Client build completed successfully', 'success');
    } catch (error) {
      this.log(`Client build failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async optimizeBuild() {
    this.log('Optimizing build for Zeabur...');
    
    const buildDir = path.join(this.clientDir, 'build');
    
    // Remove source maps if they exist (save space)
    try {
      execSync('find . -name "*.map" -delete', { cwd: buildDir, stdio: 'pipe' });
      this.log('Removed source maps to save space', 'success');
    } catch (error) {
      // Ignore errors, source maps might not exist
    }
    
    // Create a build info file
    const buildInfo = {
      timestamp: new Date().toISOString(),
      platform: 'zeabur',
      nodeVersion: process.version,
      buildSuccess: true
    };
    
    fs.writeFileSync(
      path.join(buildDir, 'build-info.json'), 
      JSON.stringify(buildInfo, null, 2)
    );
    
    this.log('Build optimization completed', 'success');
  }

  async run() {
    try {
      this.log('Starting Zeabur build process...', 'info');
      
      const platform = await this.detectPlatform();
      
      if (platform === 'zeabur') {
        await this.setupZeaburEnvironment();
      }
      
      await this.installDependencies();
      await this.verifyDependencies();
      await this.buildClient();
      await this.optimizeBuild();
      
      this.log('Zeabur build completed successfully!', 'success');
      return true;
      
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new ZeaburBuilder();
  builder.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Zeabur build failed:', error);
    process.exit(1);
  });
}

module.exports = ZeaburBuilder;