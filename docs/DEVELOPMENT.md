# 開発ガイド

このドキュメントでは、Vue Blog Admin の開発環境のセットアップと開発ガイドラインについて説明します。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [プロジェクト構造](#プロジェクト構造)
- [コーディング規約](#コーディング規約)
- [コンポーネント開発](#コンポーネント開発)
- [状態管理](#状態管理)
- [ルーティング](#ルーティング)
- [スタイリング](#スタイリング)
- [テスト](#テスト)
- [デバッグ](#デバッグ)
- [パフォーマンス最適化](#パフォーマンス最適化)

## 開発環境のセットアップ

### 必要なツール

- Node.js (v16以上)
- npm または yarn
- Git
- VS Code（推奨）
- Vue.js 開発者ツール（ブラウザ拡張）

### 推奨VS Code拡張機能

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### プロジェクトのクローンとセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd vue_blog_admin

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run serve
```

### 環境変数の設定

`.env.local` ファイルを作成：

```env
# Firebase設定（開発用）
VITE_APP_API_KEY=your_dev_api_key
VITE_APP_AUTH_DOMAIN=your_dev_auth_domain
VITE_APP_PROJECT_ID=your_dev_project_id
VITE_APP_STORAGE_BUCKET=your_dev_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=your_dev_messaging_sender_id
VITE_APP_ID=your_dev_app_id
VITE_APP_GID=your_dev_measurement_id

# 開発環境設定
VITE_APP_ROOT=http://localhost:8080
```

## プロジェクト構造

```
src/
├── api/                    # API層
│   └── base.js            # Firebase API ラッパー
├── assets/                 # 静的リソース
├── components/             # 再利用可能なコンポーネント
│   ├── Common*.vue        # 共通コンポーネント
│   └── *.vue              # 機能別コンポーネント
├── plugins/                # プラグイン設定
├── routes/                 # ルーティング設定
├── setting/                # 設定ファイル
├── stores/                 # Pinia ストア
├── types/                  # TypeScript 型定義
└── views/                  # ページコンポーネント
    ├── admin/             # 管理画面
    └── *.vue              # 一般ページ
```

## コーディング規約

### ファイル命名規則

#### コンポーネント
- PascalCase: `BlogCard.vue`
- 共通コンポーネント: `Common{Name}.vue`
- 機能別コンポーネント: `{Feature}{Name}.vue`

#### ストア
- camelCase: `blogStore.js`
- ストア名: `use{Name}Store`

#### ルート
- camelCase: `admin.ts`
- ルート名: PascalCase

### インポート規則

```javascript
// 1. 外部ライブラリ
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

// 2. 内部モジュール（絶対パス）
import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import BlogCard from '@/components/BlogCard.vue'

// 3. 相対パス（最小限）
import './style.css'
```

### 変数命名規則

```javascript
// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// 変数・関数: camelCase
const userName = 'john'
const getUserInfo = () => {}

// コンポーネント: PascalCase
const BlogCard = defineComponent({})

// ストア: camelCase
const useBlogStore = defineStore('blog', () => {})
```

### コメント規約

```javascript
/**
 * ブログ記事を作成します
 * @param {Object} blog - ブログ記事データ
 * @param {string} blog.title - タイトル
 * @param {string} blog.content - 本文
 * @returns {Promise} 作成結果
 */
const createBlog = async (blog) => {
  // 実装
}

// 単行コメント
const isPublished = true // 公開フラグ
```

## コンポーネント開発

### コンポーネントの基本構造

```vue
<template>
  <!-- テンプレート -->
</template>

<script setup>
// インポート
import { ref, computed, onMounted } from 'vue'

// Props定義
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})

// Emits定義
const emit = defineEmits(['update', 'delete'])

// リアクティブデータ
const isLoading = ref(false)
const data = ref([])

// 計算プロパティ
const filteredData = computed(() => {
  return data.value.filter(item => item.active)
})

// メソッド
const handleUpdate = () => {
  emit('update', data.value)
}

// ライフサイクル
onMounted(() => {
  // 初期化処理
})
</script>

<style scoped>
/* スタイル */
</style>
```

### Props設計

```javascript
// 必須プロパティ
const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

// オプショナルプロパティ
const props = defineProps({
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

// オブジェクトプロパティ
const props = defineProps({
  user: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.name === 'string'
    }
  }
})

// 配列プロパティ
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
```

### Emits設計

```javascript
// イベント定義
const emit = defineEmits(['update', 'delete', 'like'])

// イベント発火
const handleUpdate = (data) => {
  emit('update', {
    id: props.id,
    data: data
  })
}

const handleDelete = () => {
  emit('delete', props.id)
}
```

### スロットの使用

```vue
<!-- 親コンポーネント -->
<template>
  <BlogCard>
    <template #header>
      <h2>カスタムヘッダー</h2>
    </template>
    
    <template #content>
      <p>カスタムコンテンツ</p>
    </template>
    
    <template #footer="{ blog }">
      <p>作成者: {{ blog.author }}</p>
    </template>
  </BlogCard>
</template>

<!-- 子コンポーネント -->
<template>
  <div class="blog-card">
    <header>
      <slot name="header" />
    </header>
    
    <main>
      <slot name="content" />
    </main>
    
    <footer>
      <slot name="footer" :blog="blog" />
    </footer>
  </div>
</template>
```

## 状態管理

### Pinia ストアの作成

```javascript
// stores/exampleStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import BaseAPI from '@/api/base'

export const useExampleStore = defineStore('example', () => {
  // 状態
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ゲッター
  const itemCount = computed(() => items.value.length)
  const activeItems = computed(() => 
    items.value.filter(item => item.isActive)
  )

  // アクション
  const fetchItems = async () => {
    try {
      loading.value = true
      error.value = null
      
      const result = await BaseAPI.getDataWithQuery({
        db_name: 'items',
        searchConditions: {
          filters: [['isActive', '==', true]],
          sorters: [['createdAt', 'desc']]
        }
      })
      
      items.value = result.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addItem = async (itemData) => {
    try {
      await BaseAPI.addData(
        { db_name: 'items' },
        {
          ...itemData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      )
      await fetchItems() // 一覧を再取得
    } catch (err) {
      error.value = err.message
    }
  }

  const updateItem = async (id, itemData) => {
    try {
      await BaseAPI.setData(
        { db_name: 'items', item_id: id },
        {
          ...itemData,
          updatedAt: new Date()
        }
      )
      await fetchItems() // 一覧を再取得
    } catch (err) {
      error.value = err.message
    }
  }

  const deleteItem = async (id) => {
    try {
      await BaseAPI.deleteData({ db_name: 'items', item_id: id })
      await fetchItems() // 一覧を再取得
    } catch (err) {
      error.value = err.message
    }
  }

  return {
    // 状態
    items,
    loading,
    error,
    // ゲッター
    itemCount,
    activeItems,
    // アクション
    fetchItems,
    addItem,
    updateItem,
    deleteItem
  }
})
```

### ストアの使用

```vue
<template>
  <div>
    <div v-if="loading">読み込み中...</div>
    <div v-else-if="error">エラー: {{ error }}</div>
    <div v-else>
      <p>アイテム数: {{ itemCount }}</p>
      <ul>
        <li v-for="item in activeItems" :key="item.id">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useExampleStore } from '@/stores/exampleStore'

const exampleStore = useExampleStore()
const { items, loading, error, itemCount, activeItems } = storeToRefs(exampleStore)

onMounted(() => {
  exampleStore.fetchItems()
})
</script>
```

## ルーティング

### ルートの定義

```javascript
// routes/example.ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/example',
    name: 'Example',
    component: () => import('@/views/Example.vue'),
    meta: {
      title: '例',
      requiresAuth: true
    }
  },
  {
    path: '/example/:id',
    name: 'ExampleDetail',
    component: () => import('@/views/ExampleDetail.vue'),
    meta: {
      title: '例詳細',
      requiresAuth: true
    },
    props: true
  }
]

export default routes
```

### ナビゲーションガード

```javascript
// routes/index.ts
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const { isLogin } = storeToRefs(authStore)

  // 認証状態の初期化
  await authStore.initializeAuth()

  const isAuthRequired = to.matched.some(record => record.meta.requiresAuth)
  const isLoginPage = ['UserLogin', 'UserCreate'].includes(to.name)

  if (isAuthRequired && !isLogin.value) {
    next({ name: 'UserLogin' })
  } else if (isLoginPage && isLogin.value) {
    next({ name: 'Home' })
  } else {
    next()
  }
})
```

### プログラム的なナビゲーション

```javascript
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// ページ遷移
const goToDetail = (id) => {
  router.push({ name: 'ExampleDetail', params: { id } })
}

// クエリパラメータの使用
const search = (query) => {
  router.push({ 
    name: 'Search', 
    query: { q: query, page: 1 } 
  })
}

// 現在のルート情報
console.log(route.name) // 現在のルート名
console.log(route.params) // パラメータ
console.log(route.query) // クエリパラメータ
```

## スタイリング

### Vuetify の使用

```vue
<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>カードタイトル</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="title"
              label="タイトル"
              variant="outlined"
              :rules="[rules.required]"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="save">保存</v-btn>
            <v-btn variant="text" @click="cancel">キャンセル</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

### カスタムスタイル

```vue
<style scoped>
/* コンポーネント固有のスタイル */
.example-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.example-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .example-card {
    margin: 8px;
  }
}
</style>

<style>
/* グローバルスタイル */
.custom-class {
  color: #1976d2;
}
</style>
```

### CSS変数の使用

```vue
<style scoped>
:root {
  --primary-color: #1976d2;
  --secondary-color: #424242;
  --border-radius: 8px;
}

.example-component {
  color: var(--primary-color);
  border-radius: var(--border-radius);
}
</style>
```

## テスト

### 単体テストの例

```javascript
// tests/components/BlogCard.spec.js
import { mount } from '@vue/test-utils'
import BlogCard from '@/components/BlogCard.vue'

describe('BlogCard', () => {
  const mockBlog = {
    id: '1',
    title: 'テストブログ',
    summary: 'テストの要約',
    thumbUrl: 'https://example.com/image.jpg',
    createdAt: new Date('2023-01-01'),
    like_count: 10,
    is_like: false
  }

  const mockSetting = {
    name: 'テストユーザー',
    profileUrl: 'https://example.com/avatar.jpg'
  }

  it('正しくレンダリングされる', () => {
    const wrapper = mount(BlogCard, {
      props: {
        blog: mockBlog,
        setting: mockSetting
      }
    })

    expect(wrapper.text()).toContain('テストブログ')
    expect(wrapper.text()).toContain('テストの要約')
    expect(wrapper.text()).toContain('テストユーザー')
  })

  it('いいねボタンがクリックできる', async () => {
    const wrapper = mount(BlogCard, {
      props: {
        blog: mockBlog,
        setting: mockSetting
      }
    })

    const likeButton = wrapper.find('[data-testid="like-button"]')
    await likeButton.trigger('click')

    expect(wrapper.emitted('like')).toBeTruthy()
  })
})
```

### ストアのテスト

```javascript
// tests/stores/blogStore.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useBlogStore } from '@/stores/blogStore'

describe('BlogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ブログ一覧を取得できる', async () => {
    const blogStore = useBlogStore()
    
    // モックの設定
    jest.spyOn(blogStore, 'getListForAll').mockResolvedValue()
    
    await blogStore.getListForAll()
    
    expect(blogStore.blogList).toBeDefined()
  })
})
```

## デバッグ

### Vue DevTools の使用

1. ブラウザにVue DevTools拡張をインストール
2. 開発者ツールでVueタブを開く
3. コンポーネントの状態やpropsを確認
4. イベントの流れを追跡

### コンソールログの使用

```javascript
// デバッグ用のログ
const debugLog = (message, data) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}:`, data)
  }
}

// 使用例
const fetchData = async () => {
  debugLog('データ取得開始')
  try {
    const result = await api.getData()
    debugLog('データ取得成功', result)
    return result
  } catch (error) {
    debugLog('データ取得エラー', error)
    throw error
  }
}
```

### エラーハンドリング

```javascript
// グローバルエラーハンドラー
const handleError = (error, context = '') => {
  console.error(`[ERROR] ${context}:`, error)
  
  // エラー報告サービスに送信
  if (import.meta.env.PROD) {
    // Sentry等のエラー報告サービス
    // Sentry.captureException(error)
  }
}

// コンポーネントでの使用
const fetchData = async () => {
  try {
    const result = await api.getData()
    return result
  } catch (error) {
    handleError(error, 'データ取得')
    throw error
  }
}
```

## パフォーマンス最適化

### コンポーネントの最適化

```vue
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 重い計算をcomputedでキャッシュ
const expensiveValue = computed(() => {
  return heavyCalculation(props.data)
})

// 不要な再レンダリングを防ぐ
const memoizedData = computed(() => {
  return props.items.filter(item => item.active)
})

// イベントリスナーの適切な管理
let resizeObserver = null

onMounted(() => {
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(element.value)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>
```

### 画像の最適化

```vue
<template>
  <v-img
    :src="optimizedImageUrl"
    :lazy-src="placeholderUrl"
    aspect-ratio="16/9"
    cover
    loading="lazy"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  imageUrl: String,
  width: {
    type: Number,
    default: 800
  }
})

const optimizedImageUrl = computed(() => {
  if (!props.imageUrl) return ''
  
  // 画像最適化サービスを使用
  return `https://images.example.com/${props.imageUrl}?w=${props.width}&q=80`
})

const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+'
</script>
```

### バンドルサイズの最適化

```javascript
// vite.config.ts
export default defineConfig({
  build: {
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

## まとめ

この開発ガイドに従うことで、Vue Blog Admin の開発を効率的に進めることができます。コーディング規約、コンポーネント設計、状態管理、テストなど、プロジェクトの品質を保つためのベストプラクティスが含まれています。
