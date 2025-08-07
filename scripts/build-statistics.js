#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildStatistics {
  constructor() {
    this.statsFile = path.join(__dirname, '../build-statistics.json');
    this.reportFile = path.join(__dirname, '../build-report.json');
  }

  log(message) {
    console.log(`[Build Statistics] ${message}`);
  }

  getCurrentStats() {
    if (fs.existsSync(this.statsFile)) {
      return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
    }
    
    return {
      totalBuilds: 0,
      successfulBuilds: 0,
      failedBuilds: 0,
      averageBuildTime: 0,
      builds: []
    };
  }

  recordBuildStart() {
    const buildId = `build-${Date.now()}`;
    const buildInfo = {
      id: buildId,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      buildNumber: process.env.GITHUB_RUN_NUMBER || '0'
    };

    // 保存構建開始信息
    fs.writeFileSync(
      path.join(__dirname, '../current-build.json'),
      JSON.stringify(buildInfo, null, 2)
    );

    this.log(`構建開始: ${buildId}`);
    return buildId;
  }

  recordBuildEnd(buildId, success, apkPath = null, errors = []) {
    const currentBuildFile = path.join(__dirname, '../current-build.json');
    
    if (!fs.existsSync(currentBuildFile)) {
      this.log('警告: 找不到當前構建信息');
      return;
    }

    const buildInfo = JSON.parse(fs.readFileSync(currentBuildFile, 'utf8'));
    const endTime = new Date();
    const startTime = new Date(buildInfo.startTime);
    const duration = endTime - startTime;

    // 更新構建信息
    buildInfo.endTime = endTime.toISOString();
    buildInfo.duration = duration;
    buildInfo.status = success ? 'success' : 'failed';
    buildInfo.errors = errors;

    if (success && apkPath && fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      buildInfo.apkSize = stats.size;
      buildInfo.apkSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    }

    // 更新統計信息
    const stats = this.getCurrentStats();
    stats.totalBuilds++;
    
    if (success) {
      stats.successfulBuilds++;
    } else {
      stats.failedBuilds++;
    }

    // 計算平均構建時間
    const totalDuration = stats.builds.reduce((sum, build) => sum + (build.duration || 0), 0) + duration;
    stats.averageBuildTime = Math.round(totalDuration / stats.totalBuilds);

    // 添加構建記錄
    stats.builds.push(buildInfo);

    // 只保留最近50次構建記錄
    if (stats.builds.length > 50) {
      stats.builds = stats.builds.slice(-50);
    }

    // 保存統計信息
    fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2));

    // 生成構建報告
    this.generateBuildReport(buildInfo, stats);

    // 清理臨時文件
    fs.unlinkSync(currentBuildFile);

    this.log(`構建結束: ${buildId} (${success ? '成功' : '失敗'}, ${duration}ms)`);
  }

  generateBuildReport(buildInfo, stats) {
    const report = {
      build: buildInfo,
      statistics: {
        totalBuilds: stats.totalBuilds,
        successRate: ((stats.successfulBuilds / stats.totalBuilds) * 100).toFixed(1),
        averageBuildTime: this.formatDuration(stats.averageBuildTime),
        recentBuilds: stats.builds.slice(-10).map(build => ({
          id: build.id,
          status: build.status,
          duration: this.formatDuration(build.duration),
          apkSize: build.apkSizeMB ? `${build.apkSizeMB} MB` : 'N/A',
          timestamp: build.startTime
        }))
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        githubRunNumber: process.env.GITHUB_RUN_NUMBER,
        githubRef: process.env.GITHUB_REF
      }
    };

    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));

    // 輸出到 GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_duration=${buildInfo.duration}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `apk_size=${buildInfo.apkSizeMB || 'N/A'}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `success_rate=${report.statistics.successRate}%\n`);
    }

    this.log('構建報告已生成');
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  formatDuration(ms) {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getStatsSummary() {
    const stats = this.getCurrentStats();
    
    return {
      totalBuilds: stats.totalBuilds,
      successRate: stats.totalBuilds > 0 ? ((stats.successfulBuilds / stats.totalBuilds) * 100).toFixed(1) : '0',
      averageBuildTime: this.formatDuration(stats.averageBuildTime),
      lastBuild: stats.builds.length > 0 ? stats.builds[stats.builds.length - 1] : null
    };
  }

  displayStats() {
    const summary = this.getStatsSummary();
    
    console.log('\n📊 構建統計摘要:');
    console.log(`   總構建次數: ${summary.totalBuilds}`);
    console.log(`   成功率: ${summary.successRate}%`);
    console.log(`   平均構建時間: ${summary.averageBuildTime}`);
    
    if (summary.lastBuild) {
      console.log(`   最後構建: ${summary.lastBuild.status} (${new Date(summary.lastBuild.startTime).toLocaleString()})`);
    }
  }
}

// 導出給其他腳本使用
if (require.main === module) {
  const stats = new BuildStatistics();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      stats.recordBuildStart();
      break;
    case 'end':
      const success = process.argv[3] === 'true';
      const apkPath = process.argv[4];
      stats.recordBuildEnd('current', success, apkPath);
      break;
    case 'summary':
      stats.displayStats();
      break;
    default:
      console.log('使用方法:');
      console.log('  node build-statistics.js start');
      console.log('  node build-statistics.js end <success> [apkPath]');
      console.log('  node build-statistics.js summary');
  }
}

module.exports = BuildStatistics;