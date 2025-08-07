#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class KeystoreGenerator {
  constructor() {
    this.keystorePath = path.join(__dirname, '../android-keystore.jks');
    this.aliasName = 'smart-wardrobe-key';
  }

  log(message) {
    console.log(`[Keystore] ${message}`);
  }

  generateRandomPassword(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateKeystore() {
    const keystorePassword = this.generateRandomPassword();
    const keyPassword = this.generateRandomPassword();
    
    const command = `keytool -genkey -v -keystore ${this.keystorePath} ` +
      `-alias ${this.aliasName} -keyalg RSA -keysize 2048 -validity 10000 ` +
      `-storepass ${keystorePassword} -keypass ${keyPassword} ` +
      `-dname "CN=Smart Wardrobe, OU=Development, O=Smart Wardrobe Team, L=Taipei, ST=Taiwan, C=TW"`;

    try {
      this.log('生成 Android keystore...');
      execSync(command, { stdio: 'inherit' });
      
      // 轉換為 Base64
      const keystoreBuffer = fs.readFileSync(this.keystorePath);
      const keystoreBase64 = keystoreBuffer.toString('base64');
      
      // 輸出配置信息
      console.log('\n=== GitHub Secrets 配置 ===');
      console.log(`ANDROID_KEYSTORE_BASE64: ${keystoreBase64}`);
      console.log(`ANDROID_KEYSTORE_PASSWORD: ${keystorePassword}`);
      console.log(`ANDROID_KEY_ALIAS: ${this.aliasName}`);
      console.log(`ANDROID_KEY_PASSWORD: ${keyPassword}`);
      console.log('\n請將以上信息添加到 GitHub Secrets 中');
      
      // 清理本地 keystore 文件
      fs.unlinkSync(this.keystorePath);
      this.log('本地 keystore 文件已清理');
      
    } catch (error) {
      console.error('生成 keystore 失敗:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new KeystoreGenerator();
  generator.generateKeystore();
}

module.exports = KeystoreGenerator;