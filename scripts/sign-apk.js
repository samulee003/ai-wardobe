#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class APKSigner {
  constructor() {
    this.keystorePath = path.join(__dirname, '../temp-keystore.jks');
  }

  log(message) {
    console.log(`[APK Signer] ${message}`);
  }

  error(message) {
    console.error(`[APK Signer ERROR] ${message}`);
  }

  setupKeystore() {
    const keystoreBase64 = process.env.ANDROID_KEYSTORE_BASE64;
    
    if (!keystoreBase64) {
      throw new Error('ANDROID_KEYSTORE_BASE64 環境變數未設置');
    }

    try {
      this.log('設置 keystore 文件...');
      const keystoreBuffer = Buffer.from(keystoreBase64, 'base64');
      fs.writeFileSync(this.keystorePath, keystoreBuffer);
      this.log('Keystore 文件創建成功');
    } catch (error) {
      throw new Error(`創建 keystore 失敗: ${error.message}`);
    }
  }

  signAPK(apkPath, outputPath) {
    const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
    const keyAlias = process.env.ANDROID_KEY_ALIAS;
    const keyPassword = process.env.ANDROID_KEY_PASSWORD;

    if (!keystorePassword || !keyAlias || !keyPassword) {
      throw new Error('簽名環境變數未完整設置');
    }

    try {
      this.log(`簽名 APK: ${apkPath}`);
      
      const command = `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 ` +
        `-keystore ${this.keystorePath} -storepass ${keystorePassword} ` +
        `-keypass ${keyPassword} ${apkPath} ${keyAlias}`;

      execSync(command, { stdio: 'inherit' });
      
      // 對齊 APK
      const alignCommand = `zipalign -v 4 ${apkPath} ${outputPath}`;
      execSync(alignCommand, { stdio: 'inherit' });
      
      this.log(`簽名完成: ${outputPath}`);
      
    } catch (error) {
      throw new Error(`APK 簽名失敗: ${error.message}`);
    }
  }

  verifyAPK(apkPath) {
    try {
      this.log(`驗證 APK: ${apkPath}`);
      execSync(`jarsigner -verify -verbose -certs ${apkPath}`, { stdio: 'inherit' });
      this.log('APK 簽名驗證成功');
    } catch (error) {
      throw new Error(`APK 驗證失敗: ${error.message}`);
    }
  }

  cleanup() {
    if (fs.existsSync(this.keystorePath)) {
      fs.unlinkSync(this.keystorePath);
      this.log('臨時 keystore 文件已清理');
    }
  }

  async signAndVerify(inputAPK, outputAPK) {
    try {
      this.setupKeystore();
      this.signAPK(inputAPK, outputAPK);
      this.verifyAPK(outputAPK);
      this.log('APK 簽名和驗證完成');
    } catch (error) {
      this.error(error.message);
      throw error;
    } finally {
      this.cleanup();
    }
  }
}

module.exports = APKSigner;