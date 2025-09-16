# API ドキュメント

このドキュメントでは、Vue Blog Admin のAPI仕様について説明します。

## 目次

- [BaseAPI クラス](#baseapi-クラス)
- [認証API](#認証api)
- [ブログAPI](#ブログapi)
- [カテゴリーAPI](#カテゴリーapi)
- [ユーザーAPI](#ユーザーapi)
- [コメントAPI](#コメントapi)
- [いいねAPI](#いいねapi)
- [ブックマークAPI](#ブックマークapi)
- [画像API](#画像api)

## BaseAPI クラス

Firebase Firestore との通信を抽象化したベースクラスです。すべてのストアはこのクラスを使用してFirestoreと通信します。

### メソッド一覧

#### `getData(param)`
単一ドキュメントを取得します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID

**戻り値:** DocumentSnapshot または null

**使用例:**
```javascript
const doc = await BaseAPI.getData({
  db_name: "blog",
  item_id: "blog_id_123"
})
```

#### `getDataWithQuery(param)`
クエリ条件に基づいてドキュメントを取得します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.searchConditions.filters` (array): フィルター条件の配列
- `param.searchConditions.sorters` (array): ソート条件の配列
- `param.searchConditions.limit` (number): 取得件数制限（デフォルト: 100）

**戻り値:** QuerySnapshot

**使用例:**
```javascript
const querySnapshot = await BaseAPI.getDataWithQuery({
  db_name: "blog",
  searchConditions: {
    filters: [
      ["isPublished", "==", true],
      ["uid", "==", "user_id_123"]
    ],
    sorters: [
      ["createdAt", "desc"]
    ],
    limit: 10
  }
})
```

#### `addData(param, payload)`
新しいドキュメントを追加します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `payload` (object): 追加するデータ

**使用例:**
```javascript
await BaseAPI.addData(
  { db_name: "blog" },
  {
    title: "新しいブログ記事",
    content: "記事の内容",
    uid: "user_id_123",
    createdAt: new Date()
  }
)
```

#### `setData(param, payload)`
ドキュメントを更新または作成します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID
- `payload` (object): 更新するデータ

**使用例:**
```javascript
await BaseAPI.setData(
  { db_name: "blog", item_id: "blog_id_123" },
  {
    title: "更新されたタイトル",
    updatedAt: new Date()
  }
)
```

#### `deleteData(param)`
ドキュメントを削除します。

**パラメータ:**
- `param.db_name` (string): コレクション名
- `param.item_id` (string): ドキュメントID

**使用例:**
```javascript
await BaseAPI.deleteData({
  db_name: "blog",
  item_id: "blog_id_123"
})
```

## 認証API

### `useAuthStore`

認証関連の機能を提供するPiniaストアです。

#### メソッド

##### `create(email, password)`
新しいユーザーを登録します。

**パラメータ:**
- `email` (string): メールアドレス
- `password` (string): パスワード

**戻り値:** Promise

**エラー:**
- `auth/email-already-in-use`: 登録済みのメールアドレス
- `auth/invalid-email`: 無効なメールアドレス
- `auth/weak-password`: パスワードが短すぎる

##### `login(email, password)`
ユーザーをログインさせます。

**パラメータ:**
- `email` (string): メールアドレス
- `password` (string): パスワード

**戻り値:** Promise

##### `logout()`
ユーザーをログアウトさせます。

**戻り値:** Promise

##### `resetPassword(email)`
パスワードリセットメールを送信します。

**パラメータ:**
- `email` (string): メールアドレス

**戻り値:** Promise

##### `resetPasswordConfirm(oobCode, password)`
パスワードをリセットします。

**パラメータ:**
- `oobCode` (string): リセットコード
- `password` (string): 新しいパスワード

**戻り値:** Promise

##### `initializeAuth()`
認証状態を初期化します。

**戻り値:** Promise

#### 状態

- `userInfo` (ref): 現在のユーザー情報
- `isLogin` (ref): ログイン状態

## ブログAPI

### `useBlogStore`

ブログ記事の管理機能を提供するPiniaストアです。

#### メソッド

##### `create(blog)`
新しいブログ記事を作成します。

**パラメータ:**
```javascript
{
  title: string,         // タイトル
  summary: string,       // 要約
  content: string,       // 本文
  category_id: string,   // カテゴリーID
  isAdult: boolean,      // 成人向けフラグ
  isPublished: boolean,  // 公開フラグ
  thumbUrl: string,      // サムネイル画像URL
  share_blog_id: string  // リブログ元のブログID
}
```

**戻り値:** Promise

##### `update(blog)`
ブログ記事を更新します。

**パラメータ:**
```javascript
{
  id: string,            // ブログID
  title: string,         // タイトル
  summary: string,       // 要約
  content: string,       // 本文
  category_id: string,   // カテゴリーID
  isPublished: boolean,  // 公開フラグ
  thumbUrl: string       // サムネイル画像URL
}
```

**戻り値:** Promise

##### `getDetail(blog_id)`
ブログ記事の詳細を取得します。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise

##### `deleteItem(blog_id)`
ブログ記事を削除します。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise

##### `getList()`
自分のブログ記事一覧を取得します。

**戻り値:** Promise

##### `getListForAll()`
全ユーザーの公開ブログ記事一覧を取得します。

**戻り値:** Promise

##### `getListForFollow()`
フォロー中ユーザーのブログ記事一覧を取得します。

**戻り値:** Promise

##### `getListForBookmark()`
ブックマークしたブログ記事一覧を取得します。

**戻り値:** Promise

##### `getListForCategoryCount(category_id)`
指定されたカテゴリーのブログ記事数を取得します。

**パラメータ:**
- `category_id` (string): カテゴリーID

**戻り値:** Promise<number>

#### 状態

- `blogList` (ref): ブログ記事一覧
- `blogDetail` (ref): 現在のブログ記事詳細
- `tempBlog` (ref): 一時的なブログデータ
- `selectType` (ref): 選択された表示タイプ

## カテゴリーAPI

### `useBlogCategoryStore`

ブログカテゴリーの管理機能を提供するPiniaストアです。

#### メソッド

##### `create(category)`
新しいカテゴリーを作成します。

**パラメータ:**
```javascript
{
  pre_category_id: string, // 親カテゴリーID（nullの場合は親カテゴリー）
  name: string             // カテゴリー名
}
```

**戻り値:** Promise

##### `update(category)`
カテゴリーを更新します。

**パラメータ:**
```javascript
{
  id: string,              // カテゴリーID
  pre_category_id: string, // 親カテゴリーID
  name: string             // カテゴリー名
}
```

**戻り値:** Promise

##### `getDetail(category_id)`
カテゴリーの詳細を取得します。

**パラメータ:**
- `category_id` (string): カテゴリーID

**戻り値:** Promise

##### `deleteItem(category)`
カテゴリーを削除します。親カテゴリーを削除する場合、子カテゴリーの紐付きも削除されます。

**パラメータ:**
```javascript
{
  id: string,              // カテゴリーID
  pre_category_id: string  // 親カテゴリーID
}
```

**戻り値:** Promise

##### `getList()`
カテゴリー一覧を取得します。階層構造で並べ替えられ、ブログ記事数も含まれます。

**戻り値:** Promise

#### 状態

- `categoryList` (ref): カテゴリー一覧

## ユーザーAPI

### `useUsersStore`

ユーザー情報の管理機能を提供するPiniaストアです。

#### メソッド

##### `create(userInfo, email, password)`
新しいユーザー情報を作成します。

**パラメータ:**
- `userInfo` (object): Firebase認証のユーザー情報
- `email` (string): メールアドレス
- `password` (string): パスワード

**戻り値:** Promise

##### `update(userInfo, email, password)`
ユーザー情報を更新します。

**パラメータ:**
- `userInfo` (object): Firebase認証のユーザー情報
- `email` (string): メールアドレス
- `password` (string): 新しいパスワード

**戻り値:** Promise

##### `checkSame(email, password)`
指定されたパスワードが現在のパスワードと同じかチェックします。

**パラメータ:**
- `email` (string): メールアドレス
- `password` (string): チェックするパスワード

**戻り値:** Promise<boolean>

## コメントAPI

### `useCommentStore`

コメント機能を提供するPiniaストアです。

#### メソッド

##### `create(comment)`
新しいコメントを作成します。

**パラメータ:**
```javascript
{
  blog_id: string,        // ブログID
  content: string,        // コメント内容
  uid: string             // ユーザーID
}
```

**戻り値:** Promise

##### `getCommentCount(blog_id)`
指定されたブログのコメント数を取得します。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise<number>

## いいねAPI

### `useLikeStore`

いいね機能を提供するPiniaストアです。

#### メソッド

##### `addLike(blog)`
ブログにいいねを追加または削除します。

**パラメータ:**
- `blog` (object): ブログオブジェクト

**戻り値:** Promise

##### `getLikeCount(blog_id)`
指定されたブログのいいね数を取得します。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise<number>

##### `isLike(blog_id)`
現在のユーザーが指定されたブログにいいねしているかチェックします。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise<boolean>

## ブックマークAPI

### `useBookmarkStore`

ブックマーク機能を提供するPiniaストアです。

#### メソッド

##### `addBookmark(blog)`
ブログをブックマークに追加または削除します。

**パラメータ:**
- `blog` (object): ブログオブジェクト

**戻り値:** Promise

##### `getBlogIds()`
ブックマークしたブログのID一覧を取得します。

**戻り値:** Promise<string[]>

##### `isBookmark(blog_id)`
現在のユーザーが指定されたブログをブックマークしているかチェックします。

**パラメータ:**
- `blog_id` (string): ブログID

**戻り値:** Promise<boolean>

## 画像API

### `useImagesStore`

画像管理機能を提供するPiniaストアです。

#### メソッド

##### `uploadImage(file, folderPath)`
画像をアップロードします。

**パラメータ:**
- `file` (File): アップロードするファイル
- `folderPath` (string): アップロード先フォルダパス

**戻り値:** Promise<string> (アップロードされた画像のURL)

##### `deleteImage(imageUrl)`
画像を削除します。

**パラメータ:**
- `imageUrl` (string): 削除する画像のURL

**戻り値:** Promise

### `useImagesFolderStore`

画像フォルダ管理機能を提供するPiniaストアです。

#### メソッド

##### `createFolder(folderName)`
新しい画像フォルダを作成します。

**パラメータ:**
- `folderName` (string): フォルダ名

**戻り値:** Promise

##### `getFolderList()`
画像フォルダ一覧を取得します。

**戻り値:** Promise

## エラーハンドリング

すべてのAPIメソッドは適切なエラーハンドリングを行い、エラーが発生した場合は以下の形式でエラーを投げます：

```javascript
throw new Error(`エラーが発生しました: ${error.message}`)
```

エラーメッセージは日本語で表示され、ユーザーフレンドリーな内容になっています。

## 使用例

### ブログ記事の作成

```javascript
import { useBlogStore } from '@/stores/blogStore'

const blogStore = useBlogStore()

const newBlog = {
  title: "新しいブログ記事",
  summary: "記事の要約",
  content: "<p>記事の内容</p>",
  category_id: "category_123",
  isAdult: false,
  isPublished: true,
  thumbUrl: "https://example.com/image.jpg"
}

try {
  await blogStore.create(newBlog)
  console.log("ブログ記事が作成されました")
} catch (error) {
  console.error("エラー:", error.message)
}
```

### ブログ記事一覧の取得

```javascript
import { useBlogStore } from '@/stores/blogStore'

const blogStore = useBlogStore()

try {
  await blogStore.getListForAll()
  console.log("ブログ一覧:", blogStore.blogList)
} catch (error) {
  console.error("エラー:", error.message)
}
```

### カテゴリーの作成

```javascript
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'

const categoryStore = useBlogCategoryStore()

const newCategory = {
  name: "技術",
  pre_category_id: null // 親カテゴリー
}

try {
  await categoryStore.create(newCategory)
  console.log("カテゴリーが作成されました")
} catch (error) {
  console.error("エラー:", error.message)
}
```
