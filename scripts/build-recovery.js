#!/usr/bin/env node

/**
 * 構建回滾和恢復機制
 * 提供構建失敗時的自動回滾和恢復功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildRecovery {
  constructor() {
    this.rootDir = process.cwd();
    this.clientDir = path.join(this.rootDir, 'client');
    this.backupDir = path.join(this.rootDir, '.build-backups');
    this.recoveryLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      backup: '💾',
      recovery: '🔄'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.recoveryLog.push({
      timestamp,
      type,
      message
    });
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.log('Created backup directory', 'backup');
    }
  }

  async createBackup(label = null) {
    this.ensureBackupDirectory();
    
    const backupId = label || `backup-${Date.now()}`;
    const backupPath = path.join(this.backupDir, backupId);
    
    this.log(`Creating backup: ${backupId}`, 'backup');
    
    const backup = {
      id: backupId,
      timestamp: new Date().toISOString(),
      paths: {},
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    try {
      // Backup build directory if it exists
      const buildDir = path.join(this.clientDir, 'build');
      if (fs.existsSync(buildDir)) {
        const buildBackupPath = path.join(backupPath, 'build');
        this.copyDirectory(buildDir, buildBackupPath);
        backup.paths.build = buildBackupPath;
        this.log('Backed up build directory', 'backup');
      }

      // Backup package.json files
      const rootPackagePath = path.join(this.rootDir, 'package.json');
      if (fs.existsSync(rootPackagePath)) {
        const packageBackupPath = path.join(backupPath, 'package.json');
        fs.mkdirSync(path.dirname(packageBackupPath), { recursive: true });
        fs.copyFileSync(rootPackagePath, packageBackupPath);
        backup.paths.rootPackage = packageBackupPath;
      }

      const clientPackagePath = path.join(this.clientDir, 'package.json');
      if (fs.existsSync(clientPackagePath)) {
        const clientPackageBackupPath = path.join(backupPath, 'client-package.json');
        fs.copyFileSync(clientPackagePath, clientPackageBackupPath);
        backup.paths.clientPackage = clientPackageBackupPath;
      }

      // Backup package-lock.json files
      const rootLockPath = path.join(this.rootDir, 'package-lock.json');
      if (fs.existsSync(rootLockPath)) {
        const lockBackupPath = path.join(backupPath, 'package-lock.json');
        fs.copyFileSync(rootLockPath, lockBackupPath);
        backup.paths.rootLock = lockBackupPath;
      }

      const clientLockPath = path.join(this.clientDir, 'package-lock.json');
      if (fs.existsSync(clientLockPath)) {
        const clientLockBackupPath = path.join(backupPath, 'client-package-lock.json');
        fs.copyFileSync(clientLockPath, clientLockBackupPath);
        backup.paths.clientLock = clientLockBackupPath;
      }

      // Save backup metadata
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(backup, null, 2));

      this.log(`Backup created successfully: ${backupId}`, 'success');
      return backup;

    } catch (error) {
      this.log(`Backup creation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async listBackups() {
    this.ensureBackupDirectory();
    
    const backups = [];
    const backupDirs = fs.readdirSync(this.backupDir);

    for (const dir of backupDirs) {
      const metadataPath = path.join(this.backupDir, dir, 'backup-metadata.json');
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          backups.push(metadata);
        } catch (error) {
          this.log(`Could not read backup metadata for ${dir}`, 'warn');
        }
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async restoreFromBackup(backupId) {
    const backupPath = path.join(this.backupDir, backupId);
    const metadataPath = path.join(backupPath, 'backup-metadata.json');

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Backup ${backupId} not found`);
    }

    this.log(`Restoring from backup: ${backupId}`, 'recovery');

    try {
      const backup = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      // Restore build directory
      if (backup.paths.build) {
        const buildDir = path.join(this.clientDir, 'build');
        if (fs.existsSync(buildDir)) {
          fs.rmSync(buildDir, { recursive: true, force: true });
        }
        this.copyDirectory(backup.paths.build, buildDir);
        this.log('Restored build directory', 'recovery');
      }

      // Restore package.json files
      if (backup.paths.rootPackage) {
        const rootPackagePath = path.join(this.rootDir, 'package.json');
        fs.copyFileSync(backup.paths.rootPackage, rootPackagePath);
        this.log('Restored root package.json', 'recovery');
      }

      if (backup.paths.clientPackage) {
        const clientPackagePath = path.join(this.clientDir, 'package.json');
        fs.copyFileSync(backup.paths.clientPackage, clientPackagePath);
        this.log('Restored client package.json', 'recovery');
      }

      // Restore lock files
      if (backup.paths.rootLock) {
        const rootLockPath = path.join(this.rootDir, 'package-lock.json');
        fs.copyFileSync(backup.paths.rootLock, rootLockPath);
        this.log('Restored root package-lock.json', 'recovery');
      }

      if (backup.paths.clientLock) {
        const clientLockPath = path.join(this.clientDir, 'package-lock.json');
        fs.copyFileSync(backup.paths.clientLock, clientLockPath);
        this.log('Restored client package-lock.json', 'recovery');
      }

      this.log(`Successfully restored from backup: ${backupId}`, 'success');
      return true;

    } catch (error) {
      this.log(`Restore failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async emergencyRecovery() {
    this.log('Starting emergency recovery...', 'recovery');

    const recoverySteps = [
      {
        name: 'Clean corrupted files',
        action: async () => {
          // Remove potentially corrupted build
          const buildDir = path.join(this.clientDir, 'build');
          if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
            this.log('Removed corrupted build directory', 'recovery');
          }

          // Remove node_modules if they might be corrupted
          const rootNodeModules = path.join(this.rootDir, 'node_modules');
          const clientNodeModules = path.join(this.clientDir, 'node_modules');
          
          if (fs.existsSync(rootNodeModules)) {
            fs.rmSync(rootNodeModules, { recursive: true, force: true });
            this.log('Removed root node_modules', 'recovery');
          }
          
          if (fs.existsSync(clientNodeModules)) {
            fs.rmSync(clientNodeModules, { recursive: true, force: true });
            this.log('Removed client node_modules', 'recovery');
          }
        }
      },
      {
        name: 'Restore from latest backup',
        action: async () => {
          const backups = await this.listBackups();
          if (backups.length > 0) {
            const latestBackup = backups[0];
            await this.restoreFromBackup(latestBackup.id);
            this.log(`Restored from latest backup: ${latestBackup.id}`, 'recovery');
          } else {
            this.log('No backups available for restore', 'warn');
          }
        }
      },
      {
        name: 'Reinstall dependencies',
        action: async () => {
          try {
            execSync('npm install', { cwd: this.rootDir, stdio: 'inherit' });
            execSync('npm install', { cwd: this.clientDir, stdio: 'inherit' });
            this.log('Dependencies reinstalled', 'recovery');
          } catch (error) {
            this.log('Dependency installation failed', 'error');
            throw error;
          }
        }
      },
      {
        name: 'Verify recovery',
        action: async () => {
          try {
            execSync('npm run verify:deps', { cwd: this.rootDir, stdio: 'pipe' });
            this.log('Recovery verification passed', 'success');
          } catch (error) {
            this.log('Recovery verification failed', 'warn');
            // Don't throw, as this is just verification
          }
        }
      }
    ];

    let recoverySuccess = true;

    for (const step of recoverySteps) {
      try {
        this.log(`Executing recovery step: ${step.name}`, 'recovery');
        await step.action();
      } catch (error) {
        this.log(`Recovery step failed: ${step.name} - ${error.message}`, 'error');
        recoverySuccess = false;
        break;
      }
    }

    if (recoverySuccess) {
      this.log('Emergency recovery completed successfully', 'success');
    } else {
      this.log('Emergency recovery failed', 'error');
    }

    return recoverySuccess;
  }

  async cleanupOldBackups(maxBackups = 10) {
    const backups = await this.listBackups();
    
    if (backups.length > maxBackups) {
      const backupsToDelete = backups.slice(maxBackups);
      
      for (const backup of backupsToDelete) {
        const backupPath = path.join(this.backupDir, backup.id);
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
          this.log(`Deleted old backup: ${backup.id}`, 'backup');
        }
      }
      
      this.log(`Cleaned up ${backupsToDelete.length} old backups`, 'success');
    }
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stats = fs.statSync(srcPath);
      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async generateRecoveryReport() {
    const backups = await this.listBackups();
    
    const report = {
      timestamp: new Date().toISOString(),
      backupDirectory: this.backupDir,
      availableBackups: backups.length,
      backups: backups,
      recoveryLog: this.recoveryLog,
      diskUsage: this.calculateBackupDiskUsage()
    };

    // Save report
    const logDir = path.join(this.rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const reportPath = path.join(logDir, `recovery-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Recovery report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  calculateBackupDiskUsage() {
    if (!fs.existsSync(this.backupDir)) return 0;
    
    let totalSize = 0;
    
    const calculateDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateDir(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };
    
    calculateDir(this.backupDir);
    return totalSize;
  }
}

// CLI interface
if (require.main === module) {
  const recovery = new BuildRecovery();
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      const label = process.argv[3];
      recovery.createBackup(label).then(backup => {
        console.log(`Backup created: ${backup.id}`);
        process.exit(0);
      }).catch(error => {
        console.error('❌ Backup failed:', error);
        process.exit(1);
      });
      break;

    case 'list':
      recovery.listBackups().then(backups => {
        console.log(`Found ${backups.length} backup(s):`);
        backups.forEach(backup => {
          console.log(`  - ${backup.id} (${backup.timestamp})`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('❌ List failed:', error);
        process.exit(1);
      });
      break;

    case 'restore':
      const backupId = process.argv[3];
      if (!backupId) {
        console.error('❌ Please specify backup ID');
        process.exit(1);
      }
      recovery.restoreFromBackup(backupId).then(() => {
        console.log(`✅ Restored from backup: ${backupId}`);
        process.exit(0);
      }).catch(error => {
        console.error('❌ Restore failed:', error);
        process.exit(1);
      });
      break;

    case 'emergency':
      recovery.emergencyRecovery().then(success => {
        process.exit(success ? 0 : 1);
      }).catch(error => {
        console.error('❌ Emergency recovery failed:', error);
        process.exit(1);
      });
      break;

    case 'cleanup':
      const maxBackups = parseInt(process.argv[3]) || 10;
      recovery.cleanupOldBackups(maxBackups).then(() => {
        console.log('✅ Cleanup completed');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
      });
      break;

    default:
      console.log('Usage: node build-recovery.js <command>');
      console.log('Commands:');
      console.log('  backup [label]     - Create a backup');
      console.log('  list              - List available backups');
      console.log('  restore <id>      - Restore from backup');
      console.log('  emergency         - Emergency recovery');
      console.log('  cleanup [max]     - Cleanup old backups');
      process.exit(0);
  }
}

module.exports = BuildRecovery;