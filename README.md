# PortaCMS

Git連携に最適化された、ポータブルなファイルベース・ヘッドレスCMS

## 概要

PortaCMSは、静的サイトジェネレーター（Next.js、Astro、Eleventyなど）を利用したモダンなWeb開発ワークフローに特化したヘッドレスCMSです。コンテンツと設定を**ローカルファイルまたはクラウドストレージ**で管理し、データベース不要で強力なデータ変換機能を提供します。

### 主な特徴

- **ファイルベース管理**: 全てのコンテンツをJSON/Markdownファイルとして保存し、Gitベースのバージョン管理とワークフローを実現
- **データトランスフォーマー**: 入力用コンテンツモデルをSSG用に最適化されたデータ構造に変換する組み込みマッピング層
- **SSG連携**: コンテンツ変換を事前処理することでSSG側の複雑さを軽減
- **プラガブル・ストレージ**: アダプターパターンによりローカルファイルシステム（デフォルト）とクラウドストレージ（S3、GCS）をサポート
- **型安全性**: TypeScript + Zodスキーマによる完全な型検証
- **クリーンアーキテクチャ**: 関心の分離を明確にしたドメイン駆動設計

## アーキテクチャ

### Monorepo構成

```
PortaCMS/
├── packages/
│   ├── core/          # Domain、Application、Infrastructureレイヤー
│   └── cli/           # コマンドラインインターフェース
└── porta-data/        # データディレクトリ（`porta init`で作成）
```

### 技術スタック

- **言語**: TypeScript (ES Modules)
- **バリデーション**: Zod v4による実行時型チェック
- **アーキテクチャ**: 依存性注入を用いたクリーンアーキテクチャ
- **ストレージ**: プラガブルなリポジトリパターン（ローカルファイルシステム、S3、GCS）

### レイヤー構成

- **Domainレイヤー**: 純粋なビジネスロジックとエンティティ定義
- **Applicationレイヤー**: ユースケースとビジネスワークフロー
- **Infrastructureレイヤー**: 外部統合（ファイルシステム、データベース、API）
- **Bootstrapレイヤー**: DIコンテナとアプリケーション設定

## エンティティ構造

### 1. 階層構造の全体像

```
Project（ルートエンティティ）
└── Workspaces[]（環境分離: dev/staging/production）
    ├── ContentModels[]（コンテンツ型定義）
    │   ├── List型: アイテムの集合（例: ブログ記事、製品）
    │   │   ├── ContentItemStructure（入力フォーム構造）
    │   │   │   ├── Fields[]（入力フィールド定義）
    │   │   │   ├── Groups[]（フィールドのグループ化）
    │   │   │   ├── VirtualFields[]（JSONata式による計算フィールド）
    │   │   │   └── Categories[]（カテゴリ分類）
    │   │   ├── ContentListViewStructure[]（出力ビュー設定）
    │   │   │   ├── フィルタ・ソート設定
    │   │   │   └── ページネーション設定
    │   │   └── ContentItems[]（実際のコンテンツデータ）
    │   └── Object型: 単一オブジェクト（例: サイト設定）
    │       ├── ContentItemStructure
    │       └── 単一のContentItem
    ├── BuildSpec（SSGデータ変換のビルド設定）
    │   └── Website
    │       └── Pages[]
    │           └── Mapper（入力→出力のマッピング）
    └── Jobs[]（非同期タスク追跡）
```

### 2. コアエンティティの詳細

#### Project
- **目的**: PortaCMSプロジェクト全体を管理するルートエンティティ
- **責務**: 複数のワークスペースを集約
- **データ**: `workspaces: WorkspaceSlug[]`
- **ファイル**: `porta-data/project.json`

#### Workspace
- **目的**: 環境分離の単位（dev/staging/production）
- **責務**: 環境ごとにコンテンツとビルド設定を分離管理
- **データ**: `slug: WorkspaceSlug`（例: "production", "staging"）
- **ディレクトリ**: `porta-data/workspaces/{workspace-slug}/`
- **利用例**:
  - `dev`: 開発環境のコンテンツ
  - `staging`: ステージング環境
  - `production`: 本番環境

#### ContentModel
- **目的**: コンテンツの「型」と管理画面UI構造を定義
- **責務**: CMS管理画面とデータスキーマのメタ定義

**2つの型**:

1. **List型**: 複数アイテムのコレクション（例: ブログ記事、製品一覧）
2. **Object型**: 単一オブジェクト（例: サイト設定、会社情報）

**主要プロパティ**:
- `slug`: 識別子（例: "blog-posts", "site-config"）
- `label`: 表示名（例: "ブログ記事", "サイト設定"）
- `contentItemStructure`: 入力フォーム構造定義
- `contentListViewStructure[]`: 出力ビュー設定（List型のみ）

**ファイル**: `porta-data/workspaces/{workspace}/contents/{model-slug}/model.json`

#### ContentItemStructure
- **目的**: 管理画面の入力フォームUIとデータスキーマを定義
- **責務**: コンテンツ作成・編集のための構造定義

**構成要素**:

- **Fields[]**: 入力フィールド定義
  - `slug`: フィールドID（例: "title", "body", "publishDate"）
  - `label`: フィールド表示名
  - `schema`: データ型（String、Number、Boolean、Date、Select等）
  - `uiMetadata`: UI表示設定（required、placeholder、maxLength等）

- **Groups[]**: フィールドのグループ化（例: "基本情報", "SEO設定"）

- **VirtualFields[]**: 計算フィールド（JSONata式）

- **Categories[]**: カテゴリ分類定義

**データ型**:
- **プリミティブ型**: String、StringArray、Number、Boolean、Date、Link
- **選択型**: SingleSelect、MultipleSelect
- **関連型**: RelatedSingleSelect、RelatedMultipleSelect

#### ContentListViewStructure
- **目的**: SSG用の出力データ「ビュー」を定義（List型のみ）
- **責務**: 出力データのフィルタリング、ソート、ページネーションルールを定義

**構成要素**:
- `slug`: ビュー識別子（例: "latest-posts", "popular-products"）
- `fields[]`: 出力に含めるフィールドのリスト
- `sortFields[]`: ソート設定
- `filterRules[]`: フィルタ条件
- `type`: "paginated"（ページネーションあり）または "bounded"（件数制限のみ）

**利用例**:
- "latest-10-posts": 最新10件の記事
- "featured-products": featured=trueの製品

#### ContentItem
- **目的**: 実際のコンテンツデータ（記事、製品等）
- **責務**: ユーザーが生成するコンテンツインスタンス

**主要プロパティ**:
- `id`: UUID（自動生成）
- `slug`: URLフレンドリーな識別子
- `fields[]`: フィールド値（ContentItemStructureで定義したフィールドの実データ）
- `status`: draft/published/archived
- `publishedAt`, `expiresAt`: 公開スケジュール
- `categories[]`, `tags[]`: 分類メタデータ

**ファイル**: `porta-data/workspaces/{workspace}/contents/{model-slug}/items/{item-id}.json`

#### BuildSpec
- **目的**: CMSコンテンツからSSGデータ形式への変換を定義
- **責務**: 入力（ContentModel/ContentItem）から出力（PageContentView）へのマッピング仕様

**構成要素**:
- **Website.Pages[]**: ページ生成ルール
  - **Mapper.input**: 入力データソース
    - `iterator`: 繰り返し戦略（アイテムごと、ページごと）
    - `objectContents[]`: 参照するObject型ContentModel
    - `views[]`: 参照するContentListView
    - `context`: ページコンテキスト変数
  - **Mapper.output**: 出力ファイル命名
    - `fileName`: JSONata式（例: `"/blog/{slug}.json"`）

**ファイル**: `porta-data/workspaces/{workspace}/build-spec.json`

#### PageContentView
- **目的**: SSGテンプレートエンジン用のJSON出力
- **責務**: SSGが使用するための事前処理・最適化されたデータ

**3つの型**:
1. **Static**: 静的ページ（例: ホームページ、会社概要）
2. **Index**: 一覧ページ（例: ブログ一覧、製品カタログ）+ ページネーション
3. **Item**: 詳細ページ（例: ブログ記事、製品詳細）

**共通プロパティ**:
- `pageContext`: ページメタデータ（title、description、constants、properties）
- `objectContents`: 参照するObject型コンテンツ
- `listViews`: 参照するリストビュー

**生成場所**: `porta-data/workspaces/{workspace}/pages/`（BuildSpecにより生成）

#### BuildArtifact
- **目的**: ビルドプロセスで生成されたファイルパスを追跡
- **責務**: インクリメンタルビルドのためのビルド出力追跡

**データ**: `paths[]` - 生成されたファイルパスの配列

**利用例**: 差分ビルド、キャッシュ管理、クリーンアップ

#### Job
- **目的**: 非同期タスク管理（ビルド、長時間処理）
- **責務**: 時間のかかる処理の進捗追跡

**主要プロパティ**:
- `status`: new/in_progress/completed/failed/timed_out
- `progress`: 現在の進捗（0～steps）
- `steps`: 総ステップ数

### 3. データフローと登場人物

PortaCMSには3つの登場人物がいます:

- **開発者**: ウェブサイトの制作を行うエンジニア
- **編集者**: ウェブサイトのコンテンツを入力するライター
- **PortaCMS**: コンテンツ管理とデータ変換を行うシステム

**フェーズ1: 開発者によるセットアップ**

```
[開発者の作業]
  ↓
1. ContentModelを定義
   - 入力フォーム構造（Fields、Groups、Categories）を設計
   - 出力ビュー（ContentListViewStructure）を設計
  ↓
2. BuildSpecを定義
   - ページ生成ルール（Mapper）を設計
   - 入力データソースと出力ファイル命名規則を定義
  ↓
3. SSGテンプレートを作成
   - PageContentViewを受け取るテンプレートを実装
```

**フェーズ2: 編集者によるコンテンツ作成**

```
[編集者の作業]
  ↓
管理画面でContentItemを作成・編集
   - 開発者が定義したContentModelに従って入力
   - タイトル、本文、画像等のコンテンツを入力
   - 公開日時、カテゴリ、タグを設定
   - ステータス（下書き/公開/アーカイブ）を変更
```

**フェーズ3: PortaCMSによるビルド処理**

```
[PortaCMSの処理]
  ↓
1. BuildSpecを読み込み
  ↓
2. ContentItemとContentListViewStructureを取得
  ↓
3. Mapperを実行してデータ変換
   - フィルタリング、ソート、ページネーション適用
   - JSONata式を評価して計算フィールドを生成
  ↓
4. PageContentViewを生成
   - Static型: 静的ページ用JSON
   - Index型: 一覧ページ用JSON + ページネーション情報
   - Item型: 詳細ページ用JSON
  ↓
5. BuildArtifactに生成ファイルパスを記録
```

**フェーズ4: SSGによる静的サイト生成**

```
[SSGの処理]
  ↓
1. PageContentViewファイルを読み込み
  ↓
2. 開発者が作成したテンプレートにデータをバインド
  ↓
3. 静的HTML/CSS/JSを生成
  ↓
4. Webサーバーにデプロイ
```

**全体の流れ**

```
┌─────────────┐
│   開発者    │ ← ContentModel定義、BuildSpec定義、テンプレート作成
└─────────────┘
       ↓
┌─────────────┐
│   編集者    │ ← ContentItem作成・編集（管理画面で入力）
└─────────────┘
       ↓
┌─────────────┐
│  PortaCMS   │ ← ビルド実行、PageContentView生成
└─────────────┘
       ↓
┌─────────────┐
│     SSG     │ ← テンプレート適用、静的HTML生成
└─────────────┘
       ↓
   Webサイト公開
```

## はじめに

### 前提条件

- Node.js v18以上
- npm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/c-time/PortaCMS.git
cd PortaCMS

# 依存関係をインストール
npm install

# パッケージをビルド
npm run build
```

### プロジェクトの初期化

```bash
# 新しいPortaCMSプロジェクトを初期化
node packages/cli/bin/porta.js init

# カスタムオプション付き
node packages/cli/bin/porta.js init -d ./my-data -w production
```

以下の構造が作成されます:

```
porta-data/
├── project.json                    # プロジェクト設定
├── media/                          # メディアアセット
└── workspaces/
    └── default/                    # デフォルトワークスペース
        ├── workspace.json          # ワークスペース設定
        ├── build-spec.json         # ビルド仕様
        ├── contents/               # コンテンツモデル
        │   └── {model-slug}/
        │       ├── model.json      # モデル定義
        │       ├── items/          # コンテンツアイテム
        │       └── views/          # リストビュー出力
        └── pages/                  # 生成されたPageContentView
```

## CLI使用方法

### コンテンツモデル管理

```bash
# 全てのコンテンツモデルを一覧表示
node packages/cli/bin/porta.js content-model:list

# 新しいコンテンツモデルを作成
node packages/cli/bin/porta.js content-model:create \
  -n "ブログ記事" \
  -t list \
  --description "ブログ記事とニュース"

# コンテンツモデルのバリデーション
node packages/cli/bin/porta.js content-model:validate
```

### 利用可能なコマンド

- `init`: 新しいPortaCMSプロジェクトを初期化
- `content-model:create`: 新しいコンテンツモデルを作成
- `content-model:list`: コンテンツモデルの一覧を表示
- `content-model:validate`: 既存のコンテンツモデルをバリデーション

## プログラマティックAPI

### 基本的な使い方

```typescript
import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';

// ローカルファイルストレージでアプリケーションを設定
const app = configureApp({
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './porta-data',
    prettyPrint: true
  })
});

// ワークスペースを作成
await app.workspace.create({
  slug: 'production'
});

// コンテンツモデルを作成
await app.contentModel.create({
  workspaceSlug: 'production',
  name: 'ブログ記事',
  type: 'list',
  slug: 'blog-posts'
});

// コンテンツモデルを一覧表示
const models = await app.contentModel.list({
  workspaceSlug: 'production'
});

// コンテンツモデルをバリデーション
const validation = await app.contentModel.validate({
  workspaceSlug: 'production'
});
```

### 応用: カスタムリポジトリ

```typescript
import { DIContainer, BootstrapConfig } from '@porta-cms/core';

// カスタム設定で初期化
const config: BootstrapConfig = {
  repositoryFactory: new LocalRepositoryFactory({
    baseDir: './custom-path',
    prettyPrint: false
  })
};

DIContainer.initialize(config);
const app = DIContainer.createApplication();
```

## プロジェクト構造

### ソースコード

```
packages/
├── core/
│   └── src/
│       ├── domain/              # ドメインエンティティとロジック
│       │   ├── content-model/
│       │   ├── content-item/
│       │   ├── workspace/
│       │   ├── project/
│       │   ├── build-spec/
│       │   └── shared/
│       ├── application/         # ユースケース
│       │   ├── use-cases/
│       │   ├── driver-ports/   # 入力ポート
│       │   └── driven-ports/   # 出力ポート（Repositoryインターフェース）
│       ├── infrastructure/      # 外部アダプタ
│       │   ├── local/          # ローカルファイルシステム実装
│       │   └── factories/
│       └── bootstrap/           # DIコンテナとアプリケーション設定
└── cli/
    └── src/
        ├── commands/            # CLIコマンド実装
        └── index.ts             # CLIエントリーポイント
```

### データディレクトリ

```
porta-data/
├── project.json
├── media/
└── workspaces/
    ├── {workspace-slug}/
    │   ├── workspace.json
    │   ├── build-spec.json
    │   ├── contents/
    │   │   └── {content-model-slug}/
    │   │       ├── model.json
    │   │       ├── items/
    │   │       │   └── {item-id}.json
    │   │       └── views/
    │   │           └── {view-slug}/
    │   └── pages/
    └── ...
```

## 開発ワークフロー

### ビルド

```bash
# 全パッケージをビルド
npm run build

# 特定パッケージをビルド
npm run build:core
npm run build:cli

# クリーン＆リビルド
npm run rebuild
```

### テスト

```bash
# 全テストを実行
npm test

# coreテストをwatchモードで実行
npm run test:watch --workspace=@porta-cms/core

# UIモードで実行
npm run test:ui --workspace=@porta-cms/core
```

### Watchモード

```bash
# 全パッケージをwatch
npm run dev

# 特定パッケージをwatch
npm run dev --workspace=@porta-cms/core
```

## 実装状況

### ✅ 実装済み

- **Workspace管理**: ワークスペースの作成と管理
- **ContentModel CRUD**: コンテンツモデルの作成、一覧表示、バリデーション
- **ローカルファイルRepository**: ファイルベースストレージ実装
- **CLIコマンド**: 基本的なプロジェクト初期化とコンテンツモデル操作
- **型システム**: 全エンティティに対する完全なZodスキーマバリデーション

### 🚧 実装中

- **ContentItem CRUD**: コンテンツアイテムの作成、読み取り、更新、削除
- **ContentListView生成**: 設定に基づくリストビュー生成

### 📋 実装予定

- **ビルドシステム**: BuildSpecを実行してPageContentViewを生成
- **クラウドストレージアダプタ**: S3、Google Cloud Storageサポート
- **認証システム**: プラガブル認証（Firebase、AWS Cognito、静的認証）
- **管理UI**: Webベースのコンテンツ管理インターフェース
- **メディア管理**: メディアアセットのアップロード、整理、変換
- **バリデーションルール**: コンテンツフィールドのカスタムバリデーションロジック
- **Webhook**: ビルドトリガーとコンテンツ変更通知

## 貢献

貢献を歓迎します！以下のガイドラインに従ってください:

1. リポジトリをFork
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'feat: add amazing feature'`）
4. ブランチにPush（`git push origin feature/amazing-feature`）
5. Pull Requestを作成

### コーディング規約

- TypeScript strict modeに従う
- 全てのデータバリデーションにZodを使用
- ユースケースのユニットテストを記述
- クリーンアーキテクチャの原則に従う
- コミットをアトミックかつ説明的に保つ

## ライセンス

ISC

## リンク

- **リポジトリ**: https://github.com/c-time/PortaCMS
- **Issues**: https://github.com/c-time/PortaCMS/issues

---

**PortaCMS** - 強力なコンテンツ管理でより良い静的サイトを構築 🚀
