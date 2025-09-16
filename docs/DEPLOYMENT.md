# デプロイメント ガイド

このドキュメントでは、Vue Blog Admin のデプロイメント手順について説明します。

## 目次

- [前提条件](#前提条件)
- [環境設定](#環境設定)
- [Firebase設定](#firebase設定)
- [ビルド設定](#ビルド設定)
- [デプロイ手順](#デプロイ手順)
- [環境変数](#環境変数)
- [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必要なツール

- Node.js (v16以上)
- npm または yarn
- Firebase CLI
- Git

### Firebase CLI のインストール

```bash
npm install -g firebase-tools
```

### Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力
4. Google Analytics の設定（オプション）
5. プロジェクトを作成

## 環境設定

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd vue_blog_admin
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数ファイルの作成

プロジェクトルートに `.env` ファイルを作成：

```env
# Firebase設定
VITE_APP_API_KEY=your_api_key
VITE_APP_AUTH_DOMAIN=your_auth_domain
VITE_APP_PROJECT_ID=your_project_id
VITE_APP_STORAGE_BUCKET=your_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
VITE_APP_GID=your_measurement_id

# アプリケーション設定
VITE_APP_ROOT=https://your-domain.com
```

## Firebase設定

### 1. Firebase プロジェクトの設定

#### Authentication の有効化

1. Firebase Console でプロジェクトを選択
2. 「Authentication」→「始める」をクリック
3. 「Sign-in method」タブで「メール/パスワード」を有効化

#### Firestore Database の作成

1. 「Firestore Database」→「データベースを作成」をクリック
2. セキュリティルールを設定（開発時はテストモードで開始）
3. ロケーションを選択

#### Storage の設定

1. 「Storage」→「始める」をクリック
2. セキュリティルールを設定
3. ロケーションを選択

### 2. Firebase CLI でのログイン

```bash
firebase login
```

### 3. Firebase プロジェクトの初期化

```bash
firebase init
```

以下の機能を選択：
- Hosting
- Firestore
- Storage
- Functions（必要に応じて）

### 4. 設定ファイルの確認

`firebase.json` が正しく生成されていることを確認：

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

## ビルド設定

### 1. 本番用ビルド

```bash
npm run build
```

### 2. ビルド結果の確認

`dist` フォルダが生成され、以下のファイルが含まれていることを確認：
- `index.html`
- `assets/` フォルダ
- その他の静的ファイル

### 3. ビルド最適化

`vite.config.ts` でビルド最適化を設定：

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          vuetify: ['vuetify'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
})
```

## デプロイ手順

### 1. Firebase Hosting へのデプロイ

```bash
# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

### 2. 全機能のデプロイ

```bash
# 全機能をデプロイ
firebase deploy
```

### 3. 特定の機能のみデプロイ

```bash
# Hosting のみ
firebase deploy --only hosting

# Firestore ルールのみ
firebase deploy --only firestore:rules

# Storage ルールのみ
firebase deploy --only storage
```

## 環境変数

### 本番環境での環境変数設定

Firebase Hosting では環境変数を直接設定できないため、以下の方法を使用：

#### 1. ビルド時に環境変数を埋め込み

`.env.production` ファイルを作成：

```env
VITE_APP_API_KEY=production_api_key
VITE_APP_AUTH_DOMAIN=production_auth_domain
VITE_APP_PROJECT_ID=production_project_id
VITE_APP_STORAGE_BUCKET=production_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=production_messaging_sender_id
VITE_APP_ID=production_app_id
VITE_APP_GID=production_measurement_id
VITE_APP_ROOT=https://your-production-domain.com
```

#### 2. ビルドコマンドの実行

```bash
npm run build -- --mode production
```

### 環境別設定

#### 開発環境

```bash
npm run serve
```

#### ステージング環境

```bash
npm run build -- --mode staging
firebase deploy --project staging-project
```

#### 本番環境

```bash
npm run build -- --mode production
firebase deploy --project production-project
```

## セキュリティ設定

### Firestore セキュリティルール

`firestore.rules` ファイルを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー認証が必要
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ブログ記事
    match /blog/{blogId} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // ブログカテゴリー
    match /blog_category/{categoryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // コメント
    match /comment/{commentId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // いいね
    match /like/{likeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // ブックマーク
    match /bookmark/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

### Storage セキュリティルール

`storage.rules` ファイルを設定：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 認証されたユーザーのみ画像をアップロード可能
    match /images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // プロフィール画像
    match /profile/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## パフォーマンス最適化

### 1. 画像最適化

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    // 画像最適化プラグイン
    {
      name: 'image-optimize',
      generateBundle(options, bundle) {
        // 画像最適化処理
      }
    }
  ]
})
```

### 2. コード分割

```typescript
// ルートの遅延読み込み
const routes = [
  {
    path: '/admin',
    component: () => import('@/views/admin/HomePage.vue')
  }
]
```

### 3. キャッシュ設定

`firebase.json` でキャッシュ設定：

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 監視とログ

### 1. Firebase Analytics の設定

```typescript
// src/setting/firebase.ts
import { getAnalytics } from "firebase/analytics"

const analytics = getAnalytics(app)
```

### 2. エラーハンドリング

```typescript
// グローバルエラーハンドラー
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // エラー報告サービスに送信
})
```

### 3. パフォーマンス監視

```typescript
// パフォーマンス測定
const measurePerformance = () => {
  const navigation = performance.getEntriesByType('navigation')[0]
  console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart)
}
```

## トラブルシューティング

### よくある問題

#### 1. ビルドエラー

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュのクリア
npm run build -- --force
```

#### 2. Firebase デプロイエラー

```bash
# Firebase CLI の更新
npm install -g firebase-tools@latest

# ログインの再実行
firebase logout
firebase login
```

#### 3. 環境変数が読み込まれない

- `.env` ファイルがプロジェクトルートにあることを確認
- 環境変数名が `VITE_APP_` で始まっていることを確認
- ビルド後に環境変数が正しく埋め込まれているか確認

#### 4. ルーティングエラー

- `firebase.json` の `rewrites` 設定を確認
- すべてのルートが `index.html` にリダイレクトされていることを確認

### デバッグ方法

#### 1. 本番環境でのデバッグ

```typescript
// 開発環境でのみコンソールログを出力
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}
```

#### 2. Firebase デバッグ

```bash
# Firebase エミュレーターの使用
firebase emulators:start

# デバッグモードでのデプロイ
firebase deploy --debug
```

#### 3. ネットワークエラーの確認

```typescript
// ネットワークエラーのハンドリング
try {
  await apiCall()
} catch (error) {
  if (error.code === 'unavailable') {
    console.error('Firebase service is unavailable')
  }
}
```

## 継続的デプロイメント

### GitHub Actions の設定

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      env:
        VITE_APP_API_KEY: ${{ secrets.VITE_APP_API_KEY }}
        VITE_APP_AUTH_DOMAIN: ${{ secrets.VITE_APP_AUTH_DOMAIN }}
        VITE_APP_PROJECT_ID: ${{ secrets.VITE_APP_PROJECT_ID }}
        VITE_APP_STORAGE_BUCKET: ${{ secrets.VITE_APP_STORAGE_BUCKET }}
        VITE_APP_MESSAGING_SENDER_ID: ${{ secrets.VITE_APP_MESSAGING_SENDER_ID }}
        VITE_APP_ID: ${{ secrets.VITE_APP_ID }}
        VITE_APP_GID: ${{ secrets.VITE_APP_GID }}
        
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

### 環境変数の設定

GitHub リポジトリの Settings → Secrets で環境変数を設定：

- `VITE_APP_API_KEY`
- `VITE_APP_AUTH_DOMAIN`
- `VITE_APP_PROJECT_ID`
- `VITE_APP_STORAGE_BUCKET`
- `VITE_APP_MESSAGING_SENDER_ID`
- `VITE_APP_ID`
- `VITE_APP_GID`
- `FIREBASE_SERVICE_ACCOUNT`

## まとめ

このガイドに従って、Vue Blog Admin を Firebase にデプロイできます。セキュリティ設定、パフォーマンス最適化、継続的デプロイメントの設定も含まれているため、本番環境での運用に必要な設定が完了します。
