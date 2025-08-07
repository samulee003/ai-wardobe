#!/usr/bin/env node

/**
 * 平台適配器
 * 為不同部署平台提供特定的構建優化
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PlatformAdapter {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.platform = this.detectPlatform();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      platform: '🌐'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  detectPlatform() {
    // Check environment variables for platform detection
    if (process.env.ZEABUR || process.env.ZEABUR_SERVICE_ID) {
      return 'zeabur';
    }
    
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      return 'vercel';
    }
    
    if (process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE) {
      return 'netlify';
    }
    
    if (process.env.HEROKU_APP_NAME || process.env.DYNO) {
      return 'heroku';
    }
    
    if (process.env.DOCKER_CONTAINER || fs.existsSync('/.dockerenv')) {
      return 'docker';
    }
    
    if (process.env.CI) {
      return 'ci';
    }
    
    return 'local';
  }

  getZeaburConfig() {
    return {
      name: 'Zeabur',
      buildCommand: 'npm run build:zeabur',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=1024',
        GENERATE_SOURCEMAP: 'false',
        CI: 'false'
      },
      optimizations: {
        disableSourceMaps: true,
        disableAudit: true,
        disableFund: true,
        useProductionOnly: true
      },
      timeout: 600000, // 10 minutes
      memoryLimit: '1024Mi'
    };
  }

  getVercelConfig() {
    return {
      name: 'Vercel',
      buildCommand: 'npm run build:client',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=2048',
        GENERATE_SOURCEMAP: 'false'
      },
      optimizations: {
        disableSourceMaps: true,
        enableTreeShaking: true,
        useProductionOnly: true
      },
      timeout: 900000, // 15 minutes
      memoryLimit: '2048Mi'
    };
  }

  getNetlifyConfig() {
    return {
      name: 'Netlify',
      buildCommand: 'npm run build:client',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=2048',
        GENERATE_SOURCEMAP: 'false',
        CI: 'false'
      },
      optimizations: {
        disableSourceMaps: true,
        useProductionOnly: true
      },
      timeout: 900000, // 15 minutes
      memoryLimit: '2048Mi'
    };
  }

  getHerokuConfig() {
    return {
      name: 'Heroku',
      buildCommand: 'npm run build',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=1536',
        GENERATE_SOURCEMAP: 'false'
      },
      optimizations: {
        disableSourceMaps: true,
        useProductionOnly: true,
        enableCompression: true
      },
      timeout: 900000, // 15 minutes
      memoryLimit: '1536Mi'
    };
  }

  getDockerConfig() {
    return {
      name: 'Docker',
      buildCommand: 'npm run build',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=2048',
        GENERATE_SOURCEMAP: 'false'
      },
      optimizations: {
        disableSourceMaps: true,
        useProductionOnly: true,
        enableCaching: true
      },
      timeout: 1200000, // 20 minutes
      memoryLimit: '2048Mi'
    };
  }

  getCIConfig() {
    return {
      name: 'CI/CD',
      buildCommand: 'npm run build',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=4096',
        GENERATE_SOURCEMAP: 'false',
        CI: 'true'
      },
      optimizations: {
        disableSourceMaps: true,
        useProductionOnly: true,
        enableParallelBuilds: true
      },
      timeout: 1800000, // 30 minutes
      memoryLimit: '4096Mi'
    };
  }

  getLocalConfig() {
    return {
      name: 'Local Development',
      buildCommand: 'npm run build',
      environment: {
        NODE_OPTIONS: '--max-old-space-size=4096',
        GENERATE_SOURCEMAP: 'true'
      },
      optimizations: {
        disableSourceMaps: false,
        useProductionOnly: false,
        enableWatching: true
      },
      timeout: 1800000, // 30 minutes
      memoryLimit: '4096Mi'
    };
  }

  getPlatformConfig() {
    const configs = {
      zeabur: this.getZeaburConfig(),
      vercel: this.getVercelConfig(),
      netlify: this.getNetlifyConfig(),
      heroku: this.getHerokuConfig(),
      docker: this.getDockerConfig(),
      ci: this.getCIConfig(),
      local: this.getLocalConfig()
    };

    return configs[this.platform] || this.getLocalConfig();
  }

  async applyPlatformOptimizations(config) {
    this.log(`Applying ${config.name} optimizations...`, 'platform');

    // Set environment variables
    for (const [key, value] of Object.entries(config.environment)) {
      process.env[key] = value;
      this.log(`Set ${key}=${value}`, 'platform');
    }

    // Apply npm configurations
    if (config.optimizations.disableAudit) {
      try {
        execSync('npm config set audit false', { stdio: 'pipe' });
        this.log('Disabled npm audit', 'platform');
      } catch (error) {
        this.log('Could not disable npm audit', 'warn');
      }
    }

    if (config.optimizations.disableFund) {
      try {
        execSync('npm config set fund false', { stdio: 'pipe' });
        this.log('Disabled npm fund messages', 'platform');
      } catch (error) {
        this.log('Could not disable npm fund', 'warn');
      }
    }

    // Create platform-specific build configuration
    await this.createPlatformBuildConfig(config);

    this.log(`${config.name} optimizations applied`, 'success');
  }

  async createPlatformBuildConfig(config) {
    // Create .env.production for client
    const clientEnvPath = path.join(this.clientDir, '.env.production');
    const clientEnvContent = Object.entries(config.environment)
      .filter(([key]) => key.startsWith('REACT_APP_') || key === 'GENERATE_SOURCEMAP')
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    if (clientEnvContent) {
      fs.writeFileSync(clientEnvPath, clientEnvContent);
      this.log(`Created client .env.production`, 'platform');
    }

    // Create platform-specific package.json scripts
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Add platform-specific build script
      const platformScript = `build:${this.platform}`;
      packageJson.scripts[platformScript] = config.buildCommand;
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.log(`Added ${platformScript} script`, 'platform');
    }
  }

  async optimizeForPlatform() {
    const config = this.getPlatformConfig();
    
    this.log(`Detected platform: ${config.name}`, 'platform');
    this.log(`Build command: ${config.buildCommand}`, 'platform');
    this.log(`Memory limit: ${config.memoryLimit}`, 'platform');
    this.log(`Timeout: ${config.timeout}ms`, 'platform');

    await this.applyPlatformOptimizations(config);

    return config;
  }

  async runPlatformSpecificBuild() {
    const config = await this.optimizeForPlatform();
    
    this.log(`Starting ${config.name} build...`, 'platform');
    
    try {
      // Pre-build steps
      await this.runPreBuildSteps(config);
      
      // Main build
      const startTime = Date.now();
      execSync(config.buildCommand, {
        cwd: this.rootDir,
        stdio: 'inherit',
        timeout: config.timeout,
        env: { ...process.env, ...config.environment }
      });
      
      const buildTime = Date.now() - startTime;
      this.log(`Build completed in ${buildTime}ms`, 'success');
      
      // Post-build steps
      await this.runPostBuildSteps(config);
      
      return true;
      
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runPreBuildSteps(config) {
    this.log('Running pre-build steps...', 'platform');
    
    // Clean previous builds if needed
    if (config.optimizations.cleanBuild) {
      const buildDir = path.join(this.clientDir, 'build');
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
        this.log('Cleaned previous build', 'platform');
      }
    }
    
    // Install dependencies with platform optimizations
    const installCommand = config.optimizations.useProductionOnly 
      ? 'npm ci --only=production --no-audit --no-fund'
      : 'npm install';
    
    try {
      execSync(installCommand, { cwd: this.rootDir, stdio: 'inherit' });
      execSync(installCommand, { cwd: this.clientDir, stdio: 'inherit' });
      this.log('Dependencies installed', 'platform');
    } catch (error) {
      this.log('Dependency installation failed, trying fallback...', 'warn');
      execSync('npm install', { cwd: this.rootDir, stdio: 'inherit' });
      execSync('npm install', { cwd: this.clientDir, stdio: 'inherit' });
    }
  }

  async runPostBuildSteps(config) {
    this.log('Running post-build steps...', 'platform');
    
    const buildDir = path.join(this.clientDir, 'build');
    
    if (fs.existsSync(buildDir)) {
      // Remove source maps if disabled
      if (config.optimizations.disableSourceMaps) {
        try {
          execSync('find . -name "*.map" -delete', { cwd: buildDir, stdio: 'pipe' });
          this.log('Removed source maps', 'platform');
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Create build info
      const buildInfo = {
        platform: this.platform,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        buildConfig: config.name
      };
      
      fs.writeFileSync(
        path.join(buildDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
      );
      
      this.log('Created build info', 'platform');
    }
  }

  async generatePlatformReport() {
    const config = this.getPlatformConfig();
    
    const report = {
      timestamp: new Date().toISOString(),
      detectedPlatform: this.platform,
      platformConfig: config,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      environmentVariables: Object.keys(process.env)
        .filter(key => key.includes('ZEABUR') || key.includes('VERCEL') || key.includes('NETLIFY') || key.includes('HEROKU') || key.includes('CI'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {})
    };

    // Save report
    const logDir = path.join(this.rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const reportPath = path.join(logDir, `platform-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Platform report saved to: ${reportPath}`, 'info');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const adapter = new PlatformAdapter();
  
  if (process.argv.includes('--build')) {
    adapter.runPlatformSpecificBuild().then(success => {
      process.exit(success ? 0 : 1);
    }).catch(error => {
      console.error('❌ Platform build failed:', error);
      process.exit(1);
    });
  } else {
    adapter.generatePlatformReport().then(() => {
      console.log(`Detected platform: ${adapter.platform}`);
      process.exit(0);
    }).catch(error => {
      console.error('❌ Platform detection failed:', error);
      process.exit(1);
    });
  }
}

module.exports = PlatformAdapter;