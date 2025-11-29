# CLI Integration with Core Package

このドキュメントでは、`@porta-cms/cli`が`@porta-cms/core`をどのように統合しているかを説明します。

## Package 構成

### 依存関係の設定

`packages/cli/package.json`で、coreパッケージへの依存を定義します：

```json
{
  "dependencies": {
    "@porta-cms/core": "*"
  }
}
```

npm workspaceを使用しているため、`*`でローカルのcoreパッケージが参照されます。

### インストール

ルートディレクトリで以下を実行：

```bash
npm install
```

これにより、workspace内のすべてのパッケージ間の依存関係が自動的に解決されます。

## Core パッケージの使用

### 基本的な使用パターン

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';

// アプリケーションの設定
const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './data',
    prettyPrint: true,
    autoCreateDirectories: true
  })
});

// Use Caseの実行
const result = await app.workspace.create.execute({
  slug: 'my-workspace'
});
```

### CLI コマンドでの実装例

`packages/cli/src/commands/init.ts`を参照：

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import { join } from 'path';

export async function initCommand(options: InitOptions = {}) {
  const baseDir = options.dir || './porta-data';
  const workspaceSlug = options.workspace || 'default';

  // Core パッケージのconfigureAppを呼び出し
  const app = configureApp({
    repositoryFactory: new LocalRepositoryFactory({
      baseDir: join(process.cwd(), baseDir),
      prettyPrint: true,
      autoCreateDirectories: true,
    }),
  });

  // Use Caseを実行
  const result = await app.workspace.create.execute({
    slug: workspaceSlug,
  });

  console.log('Workspace created:', result.workspace.slug);
}
```

## ビルドとテスト

### ビルド順序

1. **Core パッケージをビルド**
   ```bash
   npm run build --workspace=@porta-cms/core
   ```

2. **CLI パッケージをビルド**
   ```bash
   npm run build --workspace=@porta-cms/cli
   ```

または、すべてのパッケージを一度にビルド：
```bash
npm run build
```

### CLI の実行

```bash
# ヘルプを表示
node packages/cli/bin/porta.js --help

# init コマンドを実行
node packages/cli/bin/porta.js init --dir ./my-data --workspace production
```

## TypeScript の型定義

Core パッケージは完全な型定義を提供しているため、CLI側で型安全に使用できます：

```typescript
import type { BootstrapConfig } from '@porta-cms/core';

const config: BootstrapConfig = {
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './data'
  })
};
```

## ファイル構造

```
PortaCMS/
├── packages/
│   ├── core/                    # コアライブラリ
│   │   ├── src/
│   │   │   ├── bootstrap/       # DIコンテナとconfigureApp
│   │   │   ├── domain/          # ドメインモデル
│   │   │   ├── application/     # ユースケース
│   │   │   └── infrastructure/  # インフラ実装
│   │   ├── dist/                # ビルド成果物
│   │   └── package.json
│   │
│   └── cli/                     # CLIツール
│       ├── src/
│       │   ├── commands/        # CLIコマンド実装
│       │   │   └── init.ts      # Coreパッケージを使用
│       │   └── index.ts         # CLIエントリーポイント
│       ├── dist/                # ビルド成果物
│       └── package.json         # @porta-cms/coreに依存
│
└── package.json                 # ルートworkspace設定
```

## トラブルシューティング

### Core パッケージが見つからない

```bash
# node_modulesをクリーンアップして再インストール
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
```

### 型定義が認識されない

```bash
# Core パッケージを再ビルド
npm run build --workspace=@porta-cms/core
```

### ビルドエラー

```bash
# 順番にビルド
npm run build:core
npm run build --workspace=@porta-cms/cli
```

## まとめ

- `@porta-cms/core`はbootstrap層のみを公開APIとして提供
- `@porta-cms/cli`はcoreパッケージをnpm workspaceで参照
- `configureApp`関数でアプリケーションを初期化
- Use Caseは`.execute()`メソッドで実行
- 型定義により完全な型安全性を提供
