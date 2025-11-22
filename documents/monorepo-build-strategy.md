# Monorepo ビルド戦略

このドキュメントでは、PortaCMSのmonorepo構成におけるビルド順序の制御方法を説明します。

## 依存関係グラフ

```
@porta-cms/core (基盤ライブラリ)
    ↓ 依存
@porta-cms/cli (CLIツール)
```

cliパッケージはcoreパッケージに依存しているため、**必ずcoreを先にビルド**する必要があります。

## ビルド順序制御の方法

### 方法1: 明示的な順序指定（現在の方法）

`package.json`で明示的に順序を指定：

```json
{
  "scripts": {
    "build": "npm run build:core && npm run build:cli",
    "build:core": "npm run build --workspace=@porta-cms/core",
    "build:cli": "npm run build --workspace=@porta-cms/cli"
  }
}
```

**利点:**
- シンプルで分かりやすい
- 順序が明確
- 追加のツール不要

**欠点:**
- パッケージが増えると管理が煩雑
- 並列ビルドができない

### 方法2: npm workspaces の自動順序解決（npm v7+）

npm workspacesは依存関係を自動解決しますが、ビルド順序は保証されません。

```json
{
  "scripts": {
    "build": "npm run build --workspaces"
  }
}
```

**問題点:**
- TypeScriptのビルドでは、依存パッケージの型定義が必要
- 並列実行される可能性があり、cliがcoreより先にビルドされるとエラーになる

### 方法3: ビルドツールの使用（大規模プロジェクト向け）

#### Turborepo

```json
{
  "scripts": {
    "build": "turbo run build"
  }
}
```

`turbo.json`:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

#### nx

```json
{
  "scripts": {
    "build": "nx run-many --target=build --all"
  }
}
```

## 推奨アプローチ

### 小〜中規模プロジェクト（現状）

**明示的な順序指定**を使用（現在の実装）

```bash
# すべてを順序通りにビルド
npm run build

# 個別にビルド
npm run build:core
npm run build:cli
```

### 大規模プロジェクト（将来）

パッケージが増えた場合は**Turborepo**または**nx**の導入を検討。

## ビルドコマンド一覧

| コマンド | 説明 | 用途 |
|---------|------|------|
| `npm run build` | coreとcliを順序通りにビルド | 通常のビルド |
| `npm run build:core` | coreパッケージのみビルド | core開発時 |
| `npm run build:cli` | cliパッケージのみビルド | cli開発時 |
| `npm run build:all` | すべてのworkspaceを並列ビルド | 全パッケージ独立時 |

## 開発ワークフロー

### 初回セットアップ

```bash
# 依存関係をインストール
npm install

# すべてをビルド
npm run build
```

### Core パッケージを変更した場合

```bash
# 1. Coreをビルド
npm run build:core

# 2. CLIをビルド（coreの変更を反映）
npm run build:cli

# または一括で
npm run build
```

### CLI パッケージのみを変更した場合

```bash
# CLIのみビルド
npm run build:cli
```

### ウォッチモード（開発中）

現在、各パッケージで個別にウォッチモード実行：

```bash
# ターミナル1: Coreをウォッチ
cd packages/core
npm run watch

# ターミナル2: CLIをウォッチ
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

### エラー: Type errors in CLI package

**原因:** coreの型定義（.d.ts）が古い

**解決策:**
```bash
# coreを再ビルド
npm run build:core

# cliを再ビルド
npm run build:cli
```

### クリーンビルド

すべてをクリーンアップして再ビルド：

```bash
# ビルド成果物を削除
npm run clean

# 依存関係を再インストール
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install

# 再ビルド
npm run build
```

## CI/CD での使用

### GitHub Actions 例

```yaml
name: Build

on: [push]

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

      - name: Build packages
        run: npm run build

      - name: Run tests
        run: npm test
```

## ビルド時間の最適化

### 現状

- **Core:** ~1-2秒
- **CLI:** ~1秒
- **合計:** ~2-3秒

### 将来の最適化案

1. **増分ビルド**: TypeScriptの`--incremental`フラグ
2. **並列ビルド**: 依存関係のないパッケージ間
3. **キャッシュ**: Turborepoのリモートキャッシュ

## まとめ

- 現在は**明示的な順序指定**で十分に機能
- `npm run build`で正しい順序でビルド
- パッケージが増えたらTurborepoやnxの導入を検討
- CI/CDでも同じ`npm run build`コマンドを使用
