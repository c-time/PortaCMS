# Bootstrap Layer

Bootstrap層は、アプリケーションの依存性注入(DI)を管理する専用層です。

## 概要

Bootstrap層は以下の責務を持ちます：

- **依存性の解決**: すべてのリポジトリ、ユースケースの依存関係を解決
- **インフラストラクチャの切り替え**: 設定により実装を切り替え可能（Local/Remote/InMemory）
- **アプリケーションの初期化**: 完全に構成されたアプリケーションインスタンスを提供
- **テストサポート**: モック実装の注入とリセット機能を提供

## 使用方法

### 基本的な使用方法

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';

// ローカルファイルベースのリポジトリで設定
const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './data',
    prettyPrint: true,
    autoCreateDirectories: true
  })
});

// アプリケーションの使用
const result = await app.workspace.create({
  slug: 'production' as WorkspaceSlug
});

console.log(result.workspace); // { slug: 'production', ... }
```

### インフラストラクチャの切り替え

設定を変更するだけで、異なるインフラストラクチャ実装に切り替えられます。

```typescript
// 開発環境: ローカルファイルベース
const devApp = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './dev-data'
  })
});

// 本番環境: リモートAPIベース (将来実装)
const prodApp = configureApp({
  repositoryFactory: new RemoteRepositoryFactory({
    apiUrl: 'https://api.example.com',
    apiKey: process.env.API_KEY
  })
});
```

## テストでの使用

### 基本的なテストセットアップ

```typescript
import { DIContainer, configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';
import { setupTestDIContainer } from '@porta-cms/core/bootstrap/test-helpers';

describe('Workspace Use Cases', () => {
  beforeEach(() => {
    // テストごとに依存関係をリセット
    setupTestDIContainer();

    // テスト用の設定でアプリケーションを初期化
    configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: './test-data'
      })
    });
  });

  it('should create a workspace', async () => {
    const app = DIContainer.createApplication();
    const result = await app.workspace.create({ slug: 'test' });
    expect(result.workspace.slug).toBe('test');
  });
});
```

### モック実装の注入

```typescript
import { overrideDependencies, resetDIContainer } from '@porta-cms/core/bootstrap/test-helpers';

describe('With mocked repositories', () => {
  let mockWorkspaceRepo: WorkspaceRepository;

  beforeEach(() => {
    resetDIContainer();

    // モックリポジトリを作成
    mockWorkspaceRepo = {
      save: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
      // ... other methods
    };

    // モック実装を注入
    overrideDependencies({
      workspaceRepository: mockWorkspaceRepo
    });
  });

  it('should call repository methods', async () => {
    const app = DIContainer.createApplication();
    await app.workspace.create({ slug: 'test' });

    expect(mockWorkspaceRepo.save).toHaveBeenCalled();
  });
});
```

## アーキテクチャ

### フォルダ構造

```
bootstrap/
├── DIContainer.ts          # DI Container実装
├── types.ts                # 設定型定義
├── index.ts                # エントリーポイント（configureApp）
├── test-helpers.ts         # テスト用ユーティリティ
└── README.md               # このファイル
```

### 依存関係の流れ

```
configureApp(config)
  ↓
DIContainer.initialize(config)
  ↓
DIContainer.createApplication()
  ↓
Application Instance (Use Cases organized by domain)
```

### Factoryパターン

```typescript
BootstrapConfig
  ↓
RepositoryFactory (interface)
  ↓
LocalRepositoryFactory (implementation)
  ↓
Individual Repository Instances
```

## 設計原則

1. **環境変数は Bootstrap 層でのみ読み込む**
   - 他の層は環境に依存しない

2. **Repository はシングルトン**
   - 同一インスタンスを再利用

3. **UseCase は都度生成**
   - ステートレスなため、毎回新規作成

4. **テスト時は依存関係を上書き可能**
   - `DIContainer.override()` でモック注入

5. **設定により実装を切り替え可能**
   - `RepositoryFactory` の実装を交換

## 今後の拡張

- [ ] RemoteRepositoryFactory の実装
- [ ] InMemoryRepositoryFactory の実装（テスト用）
- [ ] すべての UseCase の追加
- [ ] Provider（Clock, IdGenerator など）のサポート
- [ ] Application Facade の完全な型定義
