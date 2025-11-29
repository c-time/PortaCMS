# ビルドガイド

PortaCMS monorepoのビルドとビルド順序制御について説明します。

## クイックスタート

```bash
# 依存関係をインストール
npm install

# すべてをビルド（推奨）
npm run build

# テストを実行
npm test
```

## パッケージ構成と依存関係

```
@porta-cms/core          # 基盤ライブラリ
    ↓ 依存される
@porta-cms/cli           # CLIツール (coreに依存)
```

## ビルドコマンド一覧

### 基本コマンド

| コマンド | 説明 | ビルド順序 |
|---------|------|-----------|
| `npm run build` | **推奨**: すべてを正しい順序でビルド | core → cli |
| `npm run build:core` | coreパッケージのみビルド | core |
| `npm run build:cli` | cliパッケージのみビルド | cli |
| `npm run rebuild` | クリーン後に再ビルド | clean → core → cli |
| `npm run clean` | すべてのビルド成果物を削除 | - |

### 詳細コマンド

```bash
# 通常のビルド（順序保証あり）
npm run build

# クリーンビルド
npm run rebuild

# 個別パッケージのビルド
npm run build:core
npm run build:cli

# すべてのパッケージを並列ビルド（順序保証なし）
npm run build:all

# ビルド成果物の削除
npm run clean
```

## ビルド順序の重要性

### なぜ順序が重要か

`@porta-cms/cli`は`@porta-cms/core`に依存しているため：

1. **型定義の必要性**: CLIのTypeScriptコンパイルにはcoreの型定義（.d.ts）が必要
2. **ランタイム依存**: CLIの実行時にcoreのビルド済みコードが必要

### 正しい順序

```bash
# ✅ 正しい順序
npm run build:core   # 1. まずcoreをビルド
npm run build:cli    # 2. 次にcliをビルド

# または一括で
npm run build        # core → cli の順で自動実行
```

### 誤った順序

```bash
# ❌ 誤った順序（エラーになる）
npm run build:cli    # coreがビルドされていないのでエラー
```

## 開発ワークフロー

### 初回セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/c-time/PortaCMS.git
cd PortaCMS

# 2. 依存関係をインストール
npm install

# 3. すべてをビルド
npm run build
```

### Core パッケージを変更した場合

```bash
# coreを変更した後
npm run build:core

# cliも更新が必要な場合
npm run build:cli

# または両方を一度に
npm run build
```

### CLI パッケージのみ変更した場合

```bash
# cliのみビルド
npm run build:cli
```

### ウォッチモード（開発中）

複数のターミナルで並行して実行：

```bash
# ターミナル1: coreをウォッチ
cd packages/core
npm run watch

# ターミナル2: cliをウォッチ
cd packages/cli
npm run dev
```

## トラブルシューティング

### エラー: Cannot find module '@porta-cms/core'

**原因:** coreがビルドされていない

**解決策:**
```bash
npm run build:core
```

### エラー: TypeScript type errors in CLI

**原因:** coreの型定義が古いか存在しない

**解決策:**
```bash
# coreを再ビルド
npm run build:core

# cliを再ビルド
npm run build:cli
```

### 完全なクリーンビルド

すべてをリセットして再ビルド：

```bash
# 方法1: rebuildコマンドを使用（推奨）
npm run rebuild

# 方法2: 手動でクリーン
npm run clean
npm run build

# 方法3: node_modulesもクリーン（最終手段）
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
npm run build
```

**重要:** cleanコマンドは以下を削除します：
- `dist/` - ビルド成果物
- `tsconfig.tsbuildinfo` - TypeScript増分ビルド情報

`tsconfig.tsbuildinfo`が残っていると、ビルドが正しく実行されない場合があるため、クリーンビルド時は必ず削除されます。

## CI/CDでの使用

### GitHub Actions 例

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all packages
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Test CLI
        run: |
          cd packages/cli
          node bin/porta.js --version
```

## ビルド成果物

ビルド後のディレクトリ構造：

```
packages/
├── core/
│   └── dist/              # TypeScriptビルド成果物
│       ├── index.js
│       ├── index.d.ts
│       ├── bootstrap/
│       ├── domain/
│       ├── application/
│       └── infrastructure/
│
└── cli/
    └── dist/              # TypeScriptビルド成果物
        ├── index.js
        ├── index.d.ts
        └── commands/
```

## パフォーマンス

### 現在のビルド時間

- **Core:** ~1-2秒
- **CLI:** ~1秒
- **合計:** ~2-3秒

### ビルド時間の最適化

将来的な最適化案：

1. **増分ビルド**: TypeScriptの`--incremental`フラグ
2. **並列ビルド**: 依存関係のないパッケージ間
3. **ビルドツール**: TurborepoやNxの導入

## よくある質問

### Q: `npm run build:all`と`npm run build`の違いは？

**A:**
- `npm run build`: 依存順序を保証（core → cli）
- `npm run build:all`: 並列実行、順序保証なし

通常は`npm run build`を使用してください。

### Q: ビルドせずにテストを実行できますか？

**A:** いいえ。テスト実行前に必ずビルドが必要です：

```bash
npm run build
npm test
```

### Q: 個別パッケージでビルドとテストを実行できますか？

**A:** はい：

```bash
# Coreパッケージのみ
cd packages/core
npm run build
npm test

# CLIパッケージのみ（coreのビルドが前提）
cd packages/cli
npm run build
```

## まとめ

- **基本:** `npm run build`ですべてを正しい順序でビルド
- **開発:** 変更したパッケージのみ`npm run build:core`または`npm run build:cli`
- **クリーン:** `npm run rebuild`でクリーンビルド
- **依存順序:** core → cli の順序を常に維持
- **トラブル:** `npm run rebuild`で大抵の問題は解決

詳細は[Monorepo Build Strategy](docs/monorepo-build-strategy.md)を参照してください。
