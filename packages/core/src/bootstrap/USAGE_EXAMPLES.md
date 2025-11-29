# Bootstrap Layer - Usage Examples

このドキュメントでは、Bootstrap層の具体的な使用例を示します。

## 基本的な使用例

### 1. アプリケーションの初期化（ローカルファイルベース）

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';
import type { WorkspaceSlug } from '@porta-cms/core/domain';

// アプリケーションを設定
const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './data',
    prettyPrint: true,
    autoCreateDirectories: true
  })
});

// ワークスペースを作成
const result = await app.workspace.create({
  slug: 'my-workspace' as WorkspaceSlug
});

console.log('Workspace created:', result.workspace);
```

### 2. 環境別の設定

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';

// 環境変数から設定を取得
const isDevelopment = process.env.NODE_ENV === 'development';

const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: isDevelopment ? './dev-data' : './data',
    prettyPrint: isDevelopment,
    autoCreateDirectories: true
  })
});

export { app };
```

### 3. モジュールとしてのエクスポート

```typescript
// src/app.ts
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';

export const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: process.env.DATA_DIR || './data',
    prettyPrint: true
  })
});

// src/main.ts
import { app } from './app.js';

async function main() {
  const workspace = await app.workspace.create({
    slug: 'production'
  });

  console.log('Setup complete:', workspace);
}

main();
```

## テストでの使用例

### 1. 基本的なテストセットアップ

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer, configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';
import { setupTestDIContainer } from '@porta-cms/core/bootstrap/test-helpers';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Workspace Use Cases', () => {
  let testDataDir: string;

  beforeEach(() => {
    // テストごとに一時ディレクトリを作成
    testDataDir = join(tmpdir(), `test-${Date.now()}`);

    // DIコンテナをリセット
    setupTestDIContainer();

    // テスト用の設定で初期化
    configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: testDataDir,
        prettyPrint: false,
        autoCreateDirectories: true
      })
    });
  });

  it('should create a workspace', async () => {
    const app = DIContainer.createApplication();

    const result = await app.workspace.create({
      slug: 'test-workspace'
    });

    expect(result.workspace.slug).toBe('test-workspace');
  });
});
```

### 2. モックリポジトリを使用したテスト

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DIContainer, configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';
import { resetDIContainer, overrideDependencies } from '@porta-cms/core/bootstrap/test-helpers';
import type { WorkspaceRepository, ProjectRepository } from '@porta-cms/core/application/driven-ports';

describe('Workspace Use Cases with Mocks', () => {
  let mockWorkspaceRepo: WorkspaceRepository;
  let mockProjectRepo: ProjectRepository;

  beforeEach(() => {
    // DIコンテナをリセット
    resetDIContainer();

    // モックリポジトリを作成
    mockWorkspaceRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([])
    };

    mockProjectRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({ workspaceSlugs: [] }),
      exists: vi.fn().mockResolvedValue(true)
    };

    // モックを注入
    overrideDependencies({
      workspaceRepository: mockWorkspaceRepo,
      projectRepository: mockProjectRepo
    });

    // 最小限の設定で初期化（リポジトリは上書きされる）
    configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: './mock-data'
      })
    });
  });

  it('should call repository methods', async () => {
    const app = DIContainer.createApplication();

    await app.workspace.create({
      slug: 'test-workspace'
    });

    expect(mockWorkspaceRepo.exists).toHaveBeenCalledWith('test-workspace');
    expect(mockWorkspaceRepo.save).toHaveBeenCalled();
    expect(mockProjectRepo.save).toHaveBeenCalled();
  });

  it('should handle existing workspace', async () => {
    // exists を true に変更
    mockWorkspaceRepo.exists = vi.fn().mockResolvedValue(true);

    const app = DIContainer.createApplication();

    await expect(
      app.workspace.create({ slug: 'test-workspace' })
    ).rejects.toThrow();
  });
});
```

### 3. テストヘルパーを使った簡潔なテスト

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer } from '@porta-cms/core/bootstrap';
import { setupTestDIContainer } from '@porta-cms/core/bootstrap/test-helpers';

describe('Quick Tests', () => {
  beforeEach(() => {
    // リセットのみ（設定は各テストで行う）
    setupTestDIContainer();
  });

  it('should work with default setup', async () => {
    // テストケースごとに設定
    const app = DIContainer.createApplication();

    // テスト実行
    // ...
  });
});
```

## 高度な使用例

### 1. カスタムFactoryの作成

将来的にリモートAPIベースのFactoryを追加する場合：

```typescript
// infrastructure/factories/RemoteRepositoryFactory.ts
import type { RepositoryFactory } from './RepositoryFactory.js';
import type { ProjectRepository } from '../../application/driven-ports/ProjectRepository.js';
// ... other imports

export interface RemoteRepositoryConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

export class RemoteRepositoryFactory implements RepositoryFactory {
  constructor(private readonly config: RemoteRepositoryConfig) {}

  createProjectRepository(): ProjectRepository {
    return new RemoteProjectRepository(this.config);
  }

  // ... other methods
}
```

使用例：

```typescript
import { configureApp } from '@porta-cms/core/bootstrap';
import { RemoteRepositoryFactory } from '@porta-cms/core/infrastructure/factories';

const app = configureApp({
  repositoryFactory: new RemoteRepositoryFactory({
    apiUrl: 'https://api.example.com',
    apiKey: process.env.API_KEY!,
    timeout: 5000
  })
});
```

### 2. 複数環境の設定管理

```typescript
// config/app-config.ts
import type { BootstrapConfig } from '@porta-cms/core/bootstrap';
import { LocalRepositoryFactory } from '@porta-cms/core/bootstrap';

export function getAppConfig(): BootstrapConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        repositoryFactory: new LocalRepositoryFactory({
          baseDir: '/var/data/porta-cms',
          prettyPrint: false,
          autoCreateDirectories: false
        })
      };

    case 'staging':
      return {
        repositoryFactory: new LocalRepositoryFactory({
          baseDir: './staging-data',
          prettyPrint: true,
          autoCreateDirectories: true
        })
      };

    case 'development':
    default:
      return {
        repositoryFactory: new LocalRepositoryFactory({
          baseDir: './dev-data',
          prettyPrint: true,
          autoCreateDirectories: true
        })
      };
  }
}

// main.ts
import { configureApp } from '@porta-cms/core/bootstrap';
import { getAppConfig } from './config/app-config.js';

const app = configureApp(getAppConfig());
```

## まとめ

Bootstrap層を使用することで：

1. **設定の一元管理**: インフラストラクチャの設定を1箇所で管理
2. **テストの容易性**: モックの注入が簡単
3. **環境の切り替え**: 設定を変えるだけで実装を切り替え可能
4. **依存性の明確化**: すべての依存関係が見える化

これにより、クリーンなアーキテクチャを維持しながら、柔軟なアプリケーション構成が可能になります。
