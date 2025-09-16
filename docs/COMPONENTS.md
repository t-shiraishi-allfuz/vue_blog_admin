# コンポーネント ドキュメント

このドキュメントでは、Vue Blog Admin のコンポーネント仕様について説明します。

## 目次

- [共通テンプレート](#共通テンプレート)
- [レイアウトコンポーネント](#レイアウトコンポーネント)
- [ブログ関連コンポーネント](#ブログ関連コンポーネント)
- [認証関連コンポーネント](#認証関連コンポーネント)
- [その他のコンポーネント](#その他のコンポーネント)

## 共通テンプレート

### CommonTemplate.vue

一般ユーザー向けのメインレイアウトテンプレートです。

**機能:**
- ヘッダーとサイドメニューを含むレイアウト
- レスポンシブデザイン対応
- ルーター表示エリア

**構造:**
```vue
<template>
  <v-app>
    <CommonHeader />
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="2" class="sidebar-wrapper">
            <CommonSidemenu />
          </v-col>
          <v-col class="main-content">
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
```

**スタイル:**
- サイドバーは固定位置（左側）
- メインコンテンツはサイドバーの右側に配置
- レスポンシブ対応

### CommonAdminTemplate.vue

管理画面用のレイアウトテンプレートです。

**機能:**
- 管理画面専用のシンプルなレイアウト
- ヘッダーとメインコンテンツエリア

**構造:**
```vue
<template>
  <v-app>
    <CommonHeader />
    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
```

### CommonLoginTemplate.vue

ログイン画面用のレイアウトテンプレートです。

**機能:**
- ログイン・登録画面専用のレイアウト
- 認証関連のページを表示

## レイアウトコンポーネント

### CommonHeader.vue

アプリケーション全体で使用されるヘッダーコンポーネントです。

**機能:**
- 検索機能
- ユーザーメニュー
- ログイン・ログアウト機能
- ナビゲーション

**Props:**
なし（ストアから状態を取得）

**メソッド:**
- `logout()`: ログアウト処理
- `goToHome()`: ホームページへの遷移

**使用するストア:**
- `useAuthStore`: 認証状態管理
- `useBlogStore`: ブログ状態管理
- `useBlogSettingStore`: ブログ設定管理

**構造:**
```vue
<template>
  <v-app-bar color="primary" light>
    <template v-slot:prepend>
      <v-app-bar-nav-icon>
        <v-icon icon="mdi-home-circle" @click="goToHome" />
      </v-app-bar-nav-icon>
    </template>
    <v-app-bar-title>
      <v-text-field
        label="キーワードやクリエイターで検索"
        v-model="search"
        append-inner-icon="mdi-magnify"
        single-line
        hide-details
      />
    </v-app-bar-title>
    <template v-slot:append>
      <!-- ユーザーメニューまたはログインボタン -->
    </template>
  </v-app-bar>
</template>
```

### CommonSidemenu.vue

サイドメニューコンポーネントです。

**機能:**
- ナビゲーションメニュー
- カテゴリー一覧表示
- ユーザー情報表示

**Props:**
なし（ストアから状態を取得）

**使用するストア:**
- `useBlogCategoryStore`: カテゴリー管理
- `useBlogSettingStore`: ブログ設定管理

### CommonUsermenu.vue

ユーザーメニューコンポーネントです。

**Props:**
- `setting` (Object): ブログ設定情報

**機能:**
- プロフィール表示
- 設定ページへのリンク
- ログアウト機能

## ブログ関連コンポーネント

### BlogCard.vue

ブログ記事を表示するカードコンポーネントです。

**Props:**
- `blog` (Object, required): ブログ記事データ
- `setting` (Object, required): ブログ設定データ

**機能:**
- ブログ記事のサムネイル表示
- タイトル・要約表示
- 作成者情報表示
- いいね機能
- 日時表示

**データ構造:**
```javascript
// blog props
{
  id: string,
  title: string,
  summary: string,
  thumbUrl: string,
  createdAt: Date,
  like_count: number,
  is_like: boolean
}

// setting props
{
  name: string,
  profileUrl: string
}
```

**メソッド:**
- `formatDate(date)`: 日時をフォーマット
- `formatLike(blog)`: いいねアイコンを設定
- `colorIconPink(flag)`: いいねアイコンの色を設定
- `addLike(blog)`: いいねを追加/削除

**スタイル:**
- カードサイズ: 最小200px、最大300px
- サムネイル画像: 16:9のアスペクト比
- レスポンシブ対応

### BlogList.vue

ブログ記事一覧を表示するコンポーネントです。

**機能:**
- ブログ記事一覧の表示
- ページネーション
- フィルタリング機能

**Props:**
- `blogs` (Array): ブログ記事配列
- `settings` (Array): ブログ設定配列

### BlogEditTemplate.vue

ブログ記事の編集用テンプレートコンポーネントです。

**機能:**
- リッチテキストエディタ
- 画像アップロード
- カテゴリー選択
- 公開設定

**Props:**
- `blog` (Object): 編集するブログ記事データ

**使用するストア:**
- `useBlogStore`: ブログ管理
- `useBlogCategoryStore`: カテゴリー管理
- `useImagesStore`: 画像管理

### ReblogTemplate.vue

リブログ機能用のテンプレートコンポーネントです。

**機能:**
- 元のブログ記事の表示
- リブログ用のコメント追加
- リブログ作成機能

## 認証関連コンポーネント

### UserLogin.vue

ユーザーログイン画面コンポーネントです。

**機能:**
- メールアドレス・パスワード入力
- ログイン処理
- エラーハンドリング
- パスワードリセットリンク

**使用するストア:**
- `useAuthStore`: 認証管理

**バリデーション:**
- メールアドレス形式チェック
- パスワード必須チェック

### UserCreate.vue

ユーザー登録画面コンポーネントです。

**機能:**
- 新規ユーザー登録
- パスワード確認
- エラーハンドリング

**使用するストア:**
- `useAuthStore`: 認証管理

**バリデーション:**
- メールアドレス形式チェック
- パスワード強度チェック
- パスワード一致チェック

### ResetPassword.vue

パスワードリセット画面コンポーネントです。

**機能:**
- メールアドレス入力
- リセットメール送信

**使用するストア:**
- `useAuthStore`: 認証管理

### ResetPasswordConfirm.vue

パスワードリセット確認画面コンポーネントです。

**機能:**
- 新しいパスワード入力
- パスワード確認
- リセット処理

**使用するストア:**
- `useAuthStore`: 認証管理

## 管理画面コンポーネント

### BlogList.vue (管理画面)

管理画面用のブログ一覧コンポーネントです。

**機能:**
- ブログ記事一覧表示
- 編集・削除ボタン
- 公開状態の切り替え
- 検索・フィルタリング

**使用するストア:**
- `useBlogStore`: ブログ管理
- `useBlogCategoryStore`: カテゴリー管理

### BlogDetail.vue (管理画面)

管理画面用のブログ詳細コンポーネントです。

**機能:**
- ブログ記事の詳細表示
- 編集・削除機能
- コメント一覧表示
- いいね一覧表示

### BlogCreate.vue

ブログ記事作成画面コンポーネントです。

**機能:**
- 新規ブログ記事作成
- リッチテキストエディタ
- カテゴリー選択
- 画像アップロード
- 下書き保存

**使用するストア:**
- `useBlogStore`: ブログ管理
- `useBlogCategoryStore`: カテゴリー管理
- `useImagesStore`: 画像管理

### BlogCategoryList.vue

ブログカテゴリー管理画面コンポーネントです。

**機能:**
- カテゴリー一覧表示
- カテゴリー作成・編集・削除
- 階層構造の管理
- ブログ記事数の表示

**使用するストア:**
- `useBlogCategoryStore`: カテゴリー管理
- `useBlogStore`: ブログ管理

### CommentList.vue

コメント管理画面コンポーネントです。

**機能:**
- コメント一覧表示
- コメント削除
- コメント検索

**使用するストア:**
- `useCommentStore`: コメント管理

### LikeList.vue

いいね管理画面コンポーネントです。

**機能:**
- いいね一覧表示
- いいね統計情報

**使用するストア:**
- `useLikeStore`: いいね管理

### ImageFolderList.vue

画像フォルダ管理画面コンポーネントです。

**機能:**
- 画像フォルダ一覧表示
- フォルダ作成・削除
- 画像アップロード

**使用するストア:**
- `useImagesFolderStore`: 画像フォルダ管理
- `useImagesStore`: 画像管理

### PostImage.vue

画像投稿画面コンポーネントです。

**機能:**
- 画像アップロード
- 画像プレビュー
- フォルダ選択

**使用するストア:**
- `useImagesStore`: 画像管理
- `useImagesFolderStore`: 画像フォルダ管理

### PostImageList.vue

画像一覧表示コンポーネントです。

**機能:**
- アップロード済み画像一覧
- 画像削除
- 画像検索

**使用するストア:**
- `useImagesStore`: 画像管理

### SettingList.vue

設定一覧画面コンポーネントです。

**機能:**
- 各種設定へのリンク
- 設定項目の概要表示

### SettingProfile.vue

プロフィール設定画面コンポーネントです。

**機能:**
- プロフィール情報の編集
- アバター画像の変更
- ブログ設定の変更

**使用するストア:**
- `useBlogSettingStore`: ブログ設定管理
- `useImagesStore`: 画像管理

### SettingProfileFirst.vue

初回プロフィール設定画面コンポーネントです。

**機能:**
- 初回ログイン時のプロフィール設定
- 必須項目の設定

**使用するストア:**
- `useBlogSettingStore`: ブログ設定管理

### SettingProfileIcon.vue

プロフィールアイコン設定画面コンポーネントです。

**機能:**
- プロフィールアイコンの変更
- 画像アップロード

**使用するストア:**
- `useBlogSettingStore`: ブログ設定管理
- `useImagesStore`: 画像管理

### NotFound.vue

404エラーページコンポーネントです。

**機能:**
- 404エラーの表示
- ホームページへのリンク

## コンポーネント設計原則

### 命名規則

1. **共通コンポーネント**: `Common{Name}.vue`
2. **機能別コンポーネント**: `{Feature}{Name}.vue`
3. **ページコンポーネント**: `{PageName}.vue`

### Props設計

- 必須プロパティは `required: true` を設定
- 型定義を明確に指定
- デフォルト値を適切に設定

### イベント設計

- カスタムイベントは `kebab-case` で命名
- イベント名は動作を明確に表現
- 必要に応じてイベントデータを渡す

### スタイル設計

- `scoped` スタイルを使用
- CSS変数を活用
- レスポンシブデザインを考慮
- Vuetifyのクラスを優先使用

### 状態管理

- コンポーネント内の状態は `ref` または `reactive` を使用
- グローバルな状態は Pinia ストアを使用
- プロパティの変更は `emit` で親に通知

## 使用例

### BlogCardコンポーネントの使用

```vue
<template>
  <BlogCard 
    :blog="blogData" 
    :setting="userSetting"
    @like="handleLike"
  />
</template>

<script setup>
import BlogCard from '@/components/BlogCard.vue'

const blogData = {
  id: 'blog_123',
  title: 'サンプルブログ記事',
  summary: 'これはサンプルのブログ記事です。',
  thumbUrl: 'https://example.com/image.jpg',
  createdAt: new Date(),
  like_count: 10,
  is_like: false
}

const userSetting = {
  name: 'ユーザー名',
  profileUrl: 'https://example.com/avatar.jpg'
}

const handleLike = (blog) => {
  console.log('いいね:', blog)
}
</script>
```

### カスタムイベントの定義

```vue
<script setup>
const emit = defineEmits(['update', 'delete', 'like'])

const handleUpdate = () => {
  emit('update', { id: 'item_123', data: 'new_data' })
}

const handleDelete = () => {
  emit('delete', 'item_123')
}

const handleLike = (item) => {
  emit('like', item)
}
</script>
```

### プロパティの定義

```vue
<script setup>
const props = defineProps({
  // 必須プロパティ
  title: {
    type: String,
    required: true
  },
  
  // オプショナルプロパティ
  description: {
    type: String,
    default: ''
  },
  
  // オブジェクトプロパティ
  user: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.name === 'string'
    }
  },
  
  // 配列プロパティ
  items: {
    type: Array,
    default: () => []
  }
})
</script>
```
