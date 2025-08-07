#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class BuildOptimizer {
  constructor() {
    this.clientDir = path.join(__dirname, '../client');
    this.buildDir = path.join(this.clientDir, 'build');
    this.androidDir = path.join(this.clientDir, 'android');
  }

  log(message) {
    console.log(`[Build Optimizer] ${message}`);
  }

  optimizeReactBuild() {
    this.log('優化 React 構建配置...');
    
    const packageJsonPath = path.join(this.clientDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 添加構建優化腳本
    packageJson.scripts = {
      ...packageJson.scripts,
      'build:optimized': 'GENERATE_SOURCEMAP=false INLINE_RUNTIME_CHUNK=false npm run build'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('React 構建配置已優化');
  }

  optimizeAndroidBuild() {
    this.log('優化 Android 構建配置...');
    
    const buildGradlePath = path.join(this.androidDir, 'app', 'build.gradle');
    
    if (!fs.existsSync(buildGradlePath)) {
      this.log('build.gradle 不存在，跳過 Android 優化');
      return;
    }

    let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    
    // 添加構建優化配置
    const optimizations = `
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // 啟用 R8 優化
            useProguard false
            
            // 分包配置
            multiDexEnabled true
        }
        debug {
            minifyEnabled false
            shrinkResources false
            debuggable true
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    packagingOptions {
        resources {
            excludes += ['META-INF/DEPENDENCIES', 'META-INF/LICENSE', 'META-INF/LICENSE.txt', 'META-INF/NOTICE', 'META-INF/NOTICE.txt']
        }
    }`;

    // 如果還沒有優化配置，則添加
    if (!buildGradleContent.includes('minifyEnabled')) {
      buildGradleContent = buildGradleContent.replace(
        /android\s*{/,
        `android {\n${optimizations}`
      );
      
      fs.writeFileSync(buildGradlePath, buildGradleContent);
      this.log('Android 構建配置已優化');
    }
  }

  createProguardRules() {
    const proguardPath = path.join(this.androidDir, 'app', 'proguard-rules.pro');
    
    const proguardRules = `
# React Native 相關規則
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Capacitor 相關規則
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# WebView 相關規則
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保留 JavaScript 接口
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# 保留序列化相關
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# 移除日誌
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}`;

    fs.writeFileSync(proguardPath, proguardRules);
    this.log('ProGuard 規則已創建');
  }

  analyzeBuildSize() {
    if (!fs.existsSync(this.buildDir)) {
      this.log('構建目錄不存在，跳過大小分析');
      return;
    }

    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    };

    const buildSize = getDirectorySize(this.buildDir);
    const buildSizeMB = (buildSize / 1024 / 1024).toFixed(2);
    
    this.log(`構建大小: ${buildSizeMB} MB`);
    
    // 分析大文件
    const largeFiles = [];
    const findLargeFiles = (dirPath, threshold = 100 * 1024) => { // 100KB
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          findLargeFiles(filePath, threshold);
        } else if (stats.size > threshold) {
          largeFiles.push({
            path: path.relative(this.buildDir, filePath),
            size: (stats.size / 1024).toFixed(2) + ' KB'
          });
        }
      }
    };

    findLargeFiles(this.buildDir);
    
    if (largeFiles.length > 0) {
      this.log('大文件列表:');
      largeFiles.forEach(file => {
        console.log(`  ${file.path}: ${file.size}`);
      });
    }

    return {
      totalSize: buildSize,
      totalSizeMB: buildSizeMB,
      largeFiles
    };
  }

  optimize() {
    try {
      this.log('開始構建優化...');
      
      this.optimizeReactBuild();
      this.optimizeAndroidBuild();
      this.createProguardRules();
      
      const sizeAnalysis = this.analyzeBuildSize();
      
      this.log('構建優化完成');
      
      return {
        success: true,
        sizeAnalysis
      };
      
    } catch (error) {
      console.error('構建優化失敗:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize();
}

module.exports = BuildOptimizer;