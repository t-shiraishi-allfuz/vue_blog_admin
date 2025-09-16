# Vue Blog Admin

Vue 3 + TypeScript + Vuetify 3 + Firebase で構築されたブログ管理システムです。

## 📋 概要

このプロジェクトは、個人ブログの管理機能を提供するWebアプリケーションです。ユーザーはブログの作成・編集・削除、カテゴリー管理、コメント管理、いいね機能、ブックマーク機能などを利用できます。

## 🚀 技術スタック

### フロントエンド
- **Vue 3** - プログレッシブJavaScriptフレームワーク
- **TypeScript** - 型安全なJavaScript
- **Vuetify 3** - Material Design コンポーネントライブラリ
- **Vue Router 4** - ルーティング管理
- **Pinia** - 状態管理ライブラリ
- **Vite** - 高速ビルドツール

### バックエンド・データベース
- **Firebase Authentication** - ユーザー認証
- **Firebase Firestore** - NoSQLデータベース
- **Firebase Storage** - ファイルストレージ

### その他の主要ライブラリ
- **Element Plus** - UIコンポーネントライブラリ
- **Vue3-Quill** - リッチテキストエディタ
- **Vue Multiselect** - マルチセレクトコンポーネント
- **Vue SweetAlert2** - アラート・モーダル
- **Date-fns** - 日付操作ライブラリ
- **Bcryptjs** - パスワードハッシュ化

## 📁 プロジェクト構造

```
src/
├── api/                    # API関連（BaseAPIクラス）
│   └── base.js
├── assets/                 # 静的リソース（画像、アイコン等）
│   ├── images/
│   └── logo.png
├── components/             # 共通コンポーネント
│   ├── BlogCard.vue
│   ├── BlogEditTemplate.vue
│   ├── BlogList.vue
│   ├── CommonAdminTemplate.vue
│   ├── CommonHeader.vue
│   ├── CommonLoginTemplate.vue
│   ├── CommonSidemenu.vue
│   ├── CommonTemplate.vue
│   ├── CommonUsermenu.vue
│   └── ReblogTemplate.vue
├── plugins/                # プラグイン設定（Vuetify等）
│   ├── index.ts
│   └── vuetify.ts
├── routes/                 # ルーティング設定
│   ├── admin.ts           # 管理画面ルート
│   ├── blog.ts            # ブログルート
│   ├── index.ts           # メインルーター
│   └── login.ts           # 認証ルート
├── setting/               # 設定ファイル（Firebase等）
│   └── firebase.ts
├── stores/                # Piniaストア
│   ├── authStore.js       # 認証管理
│   ├── blogStore.js       # ブログ管理
│   ├── blogCategoryStore.js # カテゴリー管理
│   ├── blogSettingStore.js # ブログ設定
│   ├── bookmarkStore.js   # ブックマーク管理
│   ├── commentStore.js    # コメント管理
│   ├── followUsersStore.js # フォロー管理
│   ├── imagesFolderStore.js # 画像フォルダ管理
│   ├── imagesStore.js     # 画像管理
│   ├── likeStore.js       # いいね管理
│   └── usersStore.js      # ユーザー管理
├── types/                 # TypeScript型定義
│   └── vue3-editor.d.ts
└── views/                 # ページコンポーネント
    ├── admin/             # 管理画面ページ
    │   ├── BlogCategoryList.vue
    │   ├── BlogCreate.vue
    │   ├── BlogDetail.vue
    │   ├── BlogList.vue
    │   ├── CommentList.vue
    │   ├── HomePage.vue
    │   ├── ImageFolderList.vue
    │   ├── LikeList.vue
    │   ├── NotFound.vue
    │   ├── PostImage.vue
    │   ├── PostImageList.vue
    │   ├── ResetPassword.vue
    │   ├── ResetPasswordConfirm.vue
    │   ├── SettingList.vue
    │   ├── SettingProfile.vue
    │   ├── SettingProfileFirst.vue
    │   ├── SettingProfileIcon.vue
    │   ├── UserCreate.vue
    │   └── UserLogin.vue
    ├── BlogDetail.vue      # 一般ユーザー向けページ
    └── HomePage.vue
```

## 🛠️ セットアップ

### 前提条件
- Node.js (v16以上)
- npm または yarn
- Firebase プロジェクト

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd vue_blog_admin
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
`.env` ファイルを作成し、Firebase設定を追加：
```env
VITE_APP_API_KEY=your_api_key
VITE_APP_AUTH_DOMAIN=your_auth_domain
VITE_APP_PROJECT_ID=your_project_id
VITE_APP_STORAGE_BUCKET=your_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
VITE_APP_GID=your_measurement_id
```

### 開発サーバーの起動

```bash
npm run serve
```

アプリケーションは `http://localhost:8080` で起動します。

### 本番ビルド

```bash
npm run build
```

## 🎯 主要機能

### 認証機能
- ユーザー登録・ログイン・ログアウト
- パスワードリセット
- 認証状態の永続化

### ブログ管理
- ブログ記事の作成・編集・削除
- リッチテキストエディタ（Quill）
- 画像アップロード
- 下書き・公開状態の管理
- リブログ機能

### カテゴリー管理
- 階層構造のカテゴリー作成
- カテゴリー別ブログ表示
- カテゴリーの編集・削除

### ソーシャル機能
- いいね機能
- ブックマーク機能
- コメント機能
- フォロー機能

### 管理機能
- ダッシュボード
- ブログ一覧・詳細表示
- コメント管理
- いいね一覧
- 画像管理
- プロフィール設定

## 🔧 開発ガイドライン

### ファイル命名規則

#### コンポーネント
- 共通コンポーネント: `Common{Name}.vue`
- 機能別コンポーネント: `{Feature}{Name}.vue`

#### ストア
- ファイル名: `{name}Store.js`
- ストア名: `use{Name}Store`

#### ルート
- ファイル名: `{name}.ts`
- ルート名: PascalCase

### インポート規則
- 絶対パス（`@/`）を使用
- 相対パスは避ける
- グループ化して整理

```javascript
// 外部ライブラリ
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 内部モジュール
import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
```

### コンポーネント設計
- 単一責任の原則に従う
- 再利用可能なコンポーネントを作成
- propsとemitsを明確に定義
- 適切なスコープでスタイルを定義

### ルーティング
- 管理画面は`/admin`配下
- 認証が必要なページには`meta: { requiresAuth: true }`を設定
- ネストしたルート構造を活用

## 📚 API ドキュメント

### BaseAPI クラス

Firebase Firestore との通信を抽象化したベースクラスです。

#### メソッド

##### `getData(param)`
単一ドキュメントを取得します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID

**戻り値:** DocumentSnapshot または null

##### `getDataWithQuery(param)`
クエリ条件に基づいてドキュメントを取得します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.searchConditions.filters` (array): フィルター条件
- `param.searchConditions.sorters` (array): ソート条件
- `param.searchConditions.limit` (number): 取得件数制限

**戻り値:** QuerySnapshot

##### `addData(param, payload)`
新しいドキュメントを追加します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `payload` (object): 追加するデータ

##### `setData(param, payload)`
ドキュメントを更新または作成します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID
- `payload` (object): 更新するデータ

##### `deleteData(param)`
ドキュメントを削除します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID

## 🗄️ データベース構造

### Firestore コレクション

#### `blog`
ブログ記事のデータ

```javascript
{
  uid: string,           // 作成者のユーザーID
  title: string,         // タイトル
  summary: string,       // 要約
  content: string,       // 本文（HTML）
  category_id: string,   // カテゴリーID
  isAdult: boolean,      // 成人向けフラグ
  isPublished: boolean,  // 公開フラグ
  thumbUrl: string,      // サムネイル画像URL
  share_blog_id: string, // リブログ元のブログID
  createdAt: Date,       // 作成日時
  updatedAt: Date        // 更新日時
}
```

#### `blog_category`
ブログカテゴリーのデータ

```javascript
{
  uid: string,              // 作成者のユーザーID
  pre_category_id: string,  // 親カテゴリーID（nullの場合は親カテゴリー）
  name: string,             // カテゴリー名
  createdAt: Date,          // 作成日時
  updatedAt: Date           // 更新日時
}
```

#### `users`
ユーザー情報のデータ

```javascript
{
  email: string,        // メールアドレス
  passwordHash: string  // ハッシュ化されたパスワード
}
```

## 🚀 デプロイ

### Firebase Hosting へのデプロイ

1. Firebase CLI をインストール
```bash
npm install -g firebase-tools
```

2. Firebase にログイン
```bash
firebase login
```

3. プロジェクトを初期化
```bash
firebase init hosting
```

4. ビルドしてデプロイ
```bash
npm run build
firebase deploy
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

質問や問題がある場合は、GitHub の Issues で報告してください。