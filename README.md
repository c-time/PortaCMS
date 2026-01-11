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
- **目的**: SSG用の出力データ「ビュー」の定義（List型のみ）
- **責務**: 出力データのフィルタリング、ソート、ページネーションルールを定義

**重要**: ContentListViewStructureは「定義」、ContentListViewは「生成物」

```
┌──────────────────────────┐
│ ContentListViewStructure │ ← ContentModelに保存される設定
└──────────┬───────────────┘
           │ (実行時に適用)
           ↓
┌──────────────────────────┐
│   ContentListView        │ ← 生成されるJSON出力
└──────────────────────────┘
```

**2つのタイプ**:
- **paginated**: ページネーション対応（無限リスト向け、ページごとに分割）
- **bounded**: 件数制限のみ（limit/offset指定、シンプルな上限設定）

**構成要素**:
- `slug`: ビュー識別子（例: "latest-posts", "popular-products"）
- `fields[]`: 出力に含めるフィールドのリスト（Virtual Fields含む）
- `sortFields[]`: ソート設定（複数フィールドで優先順位指定可能）
- `filterRules[]`: フィルタ条件（eq, ne, gt, contains等のオペレーター）
- `type`: "paginated"（ページネーションあり）または "bounded"（件数制限のみ）
- `pagination`: paginated型の場合のページネーション設定
- `limit`, `offset`: bounded型の場合の件数制限

**ファイル保存**:
- **定義**: `contents/{model}/model.json` の `contentListViewStructure` 配列内
- **生成**: `contents/{model}/views/{view-slug}/` に出力

**利用例**:
- "latest-10-posts": 最新10件の記事（bounded型）
- "all-posts-paginated": 全記事をページネーション（paginated型）
- "featured-products": featured=trueの製品（bounded型）

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
- **目的**: CMSコンテンツからSSGデータ形式への変換ルールを定義
- **責務**: 入力（ContentModel/ContentItem）から出力（PageContentView）へのマッピング仕様

**Mapper構造**:

```
┌─────────────────────────┐
│        Mapper           │
├─────────────────────────┤
│ ■ input (データソース)  │
│   ├─ iterator          │ ← 繰り返し戦略
│   ├─ objectContents    │ ← 単一オブジェクト参照
│   ├─ views             │ ← リストビュー参照
│   └─ context           │ ← ページ変数
│ ■ output (ファイル出力) │
│   └─ fileName          │ ← JSONata式
└─────────────────────────┘
```

**Iterator戦略**:
- **perItem**: アイテムごとに1ページ生成 → Item型PageContentView
  - 用途: ブログ記事詳細、製品詳細ページなど
  - 要件: iteratorに指定されたContentListViewからアイテムを取得
- **perPage**: ページネーションごとに1ページ生成 → Index型PageContentView
  - 用途: ブログ一覧（ページ1、2、3...）、製品カタログなど
  - **重要**: iteratorには**必ずpaginated型のContentListView**を指定
- **無し**: 反復なし → Static型PageContentView
  - 用途: ホームページ、会社概要など固定ページ

**構成要素**:
- **Website.Pages[]**: ページ生成ルール
  - **Mapper.input**: 入力データソース
    - `iterator`: 繰り返し戦略と対象ビュー
      - `slug`: ContentListViewSlug（perPageの場合はpaginated型を指定）
      - `type`: "perItem" | "perPage"
    - `objectContents[]`: 参照するObject型ContentModel（例: サイト設定）
    - `views[]`: 参照するContentListView（例: "latest-posts"）
    - `context`: ページコンテキスト変数（constants、properties）
  - **Mapper.output**: 出力ファイル命名
    - `fileName`: JSONata式（例: `"/blog/{slug}.json"`, `"/blog/page-{currentPage}.json"`）

**ファイル**: `porta-data/workspaces/{workspace}/build-spec.json`

#### PageContentView
- **目的**: SSGテンプレートエンジン用のJSON出力
- **責務**: SSGが使用するための事前処理・最適化されたデータ

**3つの型と使い分け**:

| 型 | iterator | 用途 | 生成 |
|---|---|---|---|
| Static | なし | 静的ページ | 1ページ |
| Index | perPage | 一覧ページ | ページネーションごと |
| Item | perItem | 詳細ページ | アイテムごと |

**構造の違い**:
```
Static型:  pageContext + objectContents + listViews
Index型:   Static + paginationContext (ページ情報)
Item型:    Static + fields (個別アイテムフィールド)
```

**各型の詳細**:
1. **Static型**: 反復なしの静的ページ
   - 用途: ホームページ、会社概要、お問い合わせなど
   - 生成: 1ページのみ

2. **Index型**: ページネーション対応の一覧ページ
   - 用途: ブログ一覧、製品カタログなど
   - 生成: ページネーションごとに複数ページ
   - 追加プロパティ: `paginationContext`（現在ページ、総ページ数、ナビゲーション）

3. **Item型**: アイテムごとの詳細ページ
   - 用途: ブログ記事詳細、製品詳細ページなど
   - 生成: ContentItemごとに1ページ
   - 追加プロパティ: `fields`（個別アイテムのフィールド値）

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

**フェーズ3: ビルドプロセス** (`porta build` コマンド実行)

ContentListViewとPageContentViewは `porta build` コマンド実行時に自動生成されます。開発者が手動で作成する必要はありません。

**3-1. ContentListView生成**

```
[porta build - サブフェーズ1: ContentListView生成]
  ↓
1. ContentListViewStructureを読み込み
   - model.json内のcontentListViewStructure配列を取得
  ↓
2. ContentItemsを取得
   - 対象ContentModelの全アイテムを読み込み
   - status=publishedでフィルタ（公開済みのみ）
  ↓
3. フィルタリング・ソート・ページネーション適用
   - filterRulesに基づいてアイテムをフィルタ
   - sortFieldsに基づいてソート
   - 指定されたfieldsのみ抽出
   - Virtual Fieldsを評価（JSONata式実行）
  ↓
4. ContentListViewを生成（JSON出力）
   - paginated型: ページごとに分割して保存
     → contents/{model}/views/{view-slug}/page-1.json, page-2.json...
   - bounded型: limit/offset適用して保存
     → contents/{model}/views/{view-slug}/data.json
```

**3-2. PageContentView生成**

BuildSpecで定義されたMapper設定に基づいてPageContentViewを生成します。

```
[porta build - サブフェーズ2: PageContentView生成]
  ↓
1. BuildSpecを読み込み
   - build-spec.jsonから全Page定義を取得
  ↓
2. 各Page定義に対してMapperを実行
   ├─ Mapper.inputを解決（データ取得）
   │   ├─ iterator指定がある場合: ContentListViewを取得
   │   ├─ objectContents: Object型ContentModelを取得
   │   ├─ views: 参照するContentListViewを取得
   │   └─ context: 定数と計算プロパティを評価（JSONata）
   ├─ Iterator戦略を適用
   │   ├─ perItem: アイテムごとにループ → Item型PageContentView
   │   ├─ perPage: ページごとにループ → Index型PageContentView
   │   └─ 無し: 1回のみ実行 → Static型PageContentView
   ├─ PageContentViewを生成
   │   ├─ Static型: pageContext + objectContents + listViews
   │   ├─ Index型: Static + paginationContext
   │   └─ Item型: Static + fields
   └─ Mapper.outputでファイル名生成（JSONata評価）
       - 例: "/blog/{slug}.json" (Item型)
       - 例: "/blog/page-{currentPage}.json" (Index型)
  ↓
3. pages/ディレクトリに出力
   - pages/index.json (Static型の例)
   - pages/blog/article-slug.json (Item型の例)
   - pages/blog/page-1.json (Index型の例)
  ↓
4. BuildArtifactに生成ファイルパスを記録
   - 増分ビルド用のメタデータ保存
```

**`porta build` コマンド実行時の詳細処理**:

```
porta build 実行
  ↓
1. BuildSpec読み込み・検証
   - build-spec.jsonの妥当性チェック（Zod Schema）
   - 参照されているContentListViewの存在確認
   - Mapper定義の整合性検証
  ↓
2. サブフェーズ1: ContentListView生成
   - 各ContentModelのcontentListViewStructure配列を読み込み
   - ContentItemsを取得（status=published等でフィルタ）
   - filterRulesに基づいてアイテムをフィルタ
   - sortFieldsに基づいてソート（複数フィールド対応）
   - 指定されたfieldsのみ抽出
   - Virtual Fieldsを評価（JSONata式実行）
   - paginated型: ページごとに分割 → views/{view-slug}/page-{n}.json
   - bounded型: limit/offset適用 → views/{view-slug}/data.json
  ↓
3. サブフェーズ2: PageContentView生成
   - BuildSpec.pages[]を順次処理（並列処理オプション対応）
   - Mapper.inputからデータ取得:
     - iterator: ContentListViewを読み込み
     - objectContents: Object型ContentModelを読み込み
     - views: 参照するContentListViewを読み込み
     - context: 定数と計算プロパティを評価（JSONata）
   - Iterator戦略に応じてループ:
     - perItem: 各アイテムでPageContentView生成 → Item型
     - perPage: 各ページでPageContentView生成 → Index型
     - なし: 1回のみPageContentView生成 → Static型
   - Mapper.outputでファイル名生成（JSONata評価）
   - pages/ディレクトリに出力
   - --skip-if-identical: 既存ファイルと内容比較、同一ならスキップ
  ↓
4. BuildArtifact保存
   - 生成ファイルパス一覧を記録
   - ソースファイルのタイムスタンプを保存（増分ビルド用）
   - ビルド成功/失敗情報を記録
  ↓
5. 結果サマリー表示
   - ContentListView: 生成成功/失敗件数
   - PageContentView: 生成成功/失敗件数
   - エラー詳細（あれば全て表示）
   - 実行時間（ms）
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

### ビルドコマンド

`porta build` コマンドは、ContentListViewとPageContentViewを生成します。複数のビルドモードとオプションを提供し、開発フローに合わせた柔軟なビルドが可能です。

#### ビルドモード

| モード | コマンド | 説明 |
|---|---|---|
| **フルビルド** | `porta build` | 全ContentListView + 全PageContentViewをビルド |
| **増分ビルド** | `porta build --incremental` | 変更のあったエンティティと依存先のみビルド |
| **List Viewのみ** | `porta build --views-only [--model <model-slug>]` | 全ContentListViewのみ生成（--model指定時は特定モデルのみ） |
| **Page Viewのみ** | `porta build --pages-only` | 全PageContentViewのみ生成 |
| **特定List View** | `porta build --model <model-slug> --view <view-slug>` | 指定したContentListViewのみビルド |
| **特定Page** | `porta build --page <page-slug>` | 指定したPageContentViewのみビルド |
| **クリーンビルド** | `porta build --clean` | 生成ファイルを全削除してフルビルド |
| **検証のみ** | `porta build --validate` | BuildSpecの妥当性検証のみ（生成なし） |
| **Watchモード** | `porta build --watch` | ファイル変更監視、増分ビルド自動実行 |
| **ドライラン** | `porta build --dry-run` | ビルド計画を表示、実行はしない |

#### ビルドモード詳細

##### フルビルドとクリーンビルドの違い

**フルビルド** (`porta build`):
- 全ContentListViewと全PageContentViewを生成
- 既存の生成ファイルは上書きするが、削除はしない
- 古い不要なファイル（BuildSpecから削除したページ等）が残る可能性あり
- 通常のビルドで使用

**クリーンビルド** (`porta build --clean`):
- まず `contents/*/views/` と `pages/` を全削除
- その後フルビルドを実行
- 不要なファイルが確実に削除される
- BuildSpecを大きく変更した後や、ファイル構造を整理したい時に使用

**増分ビルド** (`porta build --incremental`):
- 前回ビルド以降の変更を検知
- 変更されたエンティティと、その依存先のみ再生成
- タイムスタンプベースの変更検知
- 開発時の高速なビルドに最適

#### ビルドオプション

##### 基本オプション

```bash
-w, --workspace <slug>    # ワークスペース指定（デフォルト: "default"）
-d, --dir <path>          # データディレクトリパス（デフォルト: "./porta-data"）
```

##### ビルド制御

```bash
--force                   # キャッシュを無視して強制再ビルド
--fail-fast               # 最初のエラーで停止
--continue-on-error       # エラーがあっても続行（デフォルト）
--parallel <n>            # 並列ビルドジョブ数（デフォルト: 4）
--skip-if-identical       # 生成内容が既存ファイルと同一ならスキップ（Git差分最小化）
```

##### 出力制御

```bash
-v, --verbose             # 詳細ログ出力
-q, --quiet               # エラーのみ出力
--json                    # JSON形式で結果出力
--progress                # プログレスバー表示（デフォルト: true）
```

##### Watchモード設定

```bash
--watch-debounce <ms>     # 変更検知のデバウンス時間（デフォルト: 300ms）
--watch-poll <ms>         # ポーリング間隔（デフォルト: 1000ms）
```

#### ビルドコマンド使用例

##### 開発時の典型的なワークフロー

```bash
# 初回ビルド（クリーンビルドで開始）
porta build --clean

# 開発中は watchモードで自動ビルド
porta build --watch

# 別のターミナルでコンテンツ編集
porta content-model:create -n articles --type list
# ... ContentItem作成 ...
# → watchモードが自動的に増分ビルド実行
```

##### 特定のViewやPageのみビルド

```bash
# 特定のContentListViewのみ再生成
porta build --model articles --view latest-posts

# 全モデルの特定ビュー名を持つViewを再生成
porta build --views-only --model articles

# 特定のPageのみ再生成
porta build --page blog-index
```

##### 検証とドライラン

```bash
# BuildSpecの検証のみ（生成はしない）
porta build --validate

# ビルド計画の確認（実行はしない）
porta build --dry-run

# ビルド計画を確認してから実行
porta build --dry-run && porta build
```

##### 並列ビルドとエラーハンドリング

```bash
# 8並列でビルド、エラーがあっても全て実行して収集
porta build --parallel 8 --continue-on-error

# 最初のエラーで即座に停止
porta build --fail-fast

# 内容が同一ならスキップ（Git差分最小化）
porta build --skip-if-identical
```

##### CI/CDでの使用例

```bash
# CI環境: クリーンビルド + 検証 + Git差分最小化
porta build --clean --skip-if-identical --fail-fast

# プロダクションビルド: 並列ビルド + 詳細ログ
porta build --parallel 8 --verbose --fail-fast
```

### CLIコマンドリファレンス

#### 設計思想

- 生成されたJSONファイルは**開発者が直接編集する**ことを前提
- CLIは主に**初期化・生成・検証・ビルド**を担当
- インタラクティブな編集機能は提供せず、エディタでの直接編集を推奨

#### コマンド一覧

**プロジェクト管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `init` | ✅ | プロジェクトを初期化（project.json、workspace作成） |

**Workspace管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `workspace:create` | 📋 | 新しいワークスペースディレクトリとworkspace.jsonを生成 |
| `workspace:list` | 📋 | 全ワークスペースを一覧表示 |

**ContentModel管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `content-model:create` | ✅ | コンテンツモデルの雛形（model.json）を生成 |
| `content-model:list` | ✅ | 全コンテンツモデルを一覧表示 |
| `content-model:validate` | ✅ | model.jsonのスキーマバリデーション |

> **Note**: `content-model:create`は実用的なサンプルフィールド、グループ、ContentListViewStructure（List型の場合）を含む雛形を生成します。開発者はこれをベースに、エディタで不要な部分を削除し、必要なフィールドやビューを追加してください。

**ContentItem（コンテンツ）管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `content:create` | 📋 | コンテンツアイテムの雛形（{id}.json）を生成 |
| `content:list` | 📋 | コンテンツアイテムを一覧表示 |
| `content:validate` | 📋 | コンテンツアイテムのスキーマバリデーション |

> **Note**: 生成されたアイテムJSONは開発者がエディタで直接編集してコンテンツを入力

**Build（ビルド）管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `build` | 📋 | BuildSpecに基づいてPageContentViewを生成 |
| `build:clean` | 📋 | 生成されたPageContentViewを削除 |

> **Note**: build-spec.jsonは開発者が直接編集してページ生成ルールを定義

**BuildSpec管理**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `build-spec:init` | 📋 | build-spec.jsonの雛形を生成 |
| `build-spec:validate` | 📋 | build-spec.jsonのバリデーション |

**バリデーション統合**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `validate` | 📋 | プロジェクト全体のバリデーション（全JSONファイル） |

**開発・デバッグ**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `watch` | 📋 | ファイル変更を監視して自動バリデーション/ビルド |
| `info` | 📋 | プロジェクト情報を表示（統計、構成） |
| `doctor` | 📋 | プロジェクトの健全性チェック |

**データ移行**

| コマンド | 状態 | 目的 |
|---------|------|------|
| `export` | 📋 | ワークスペース全体をZIP/JSONにエクスポート |
| `import` | 📋 | エクスポートしたデータをインポート |

#### 開発ワークフロー例

```bash
# 1. プロジェクト初期化
porta init -d ./my-cms

# 2. コンテンツモデル作成（サンプル付き雛形生成）
porta content-model:create -n "ブログ記事" -t list

# 3. 生成されたmodel.jsonを確認（サンプルフィールドとビューが含まれる）
cat ./my-cms/workspaces/default/contents/blog-posts/model.json

# 4. エディタで不要なフィールドを削除、必要なフィールドを追加
vim ./my-cms/workspaces/default/contents/blog-posts/model.json

# 5. バリデーション
porta content-model:validate

# 6. コンテンツアイテム作成（雛形生成）
porta content:create -m blog-posts

# 7. エディタでコンテンツを入力
vim ./my-cms/workspaces/default/contents/blog-posts/items/{id}.json

# 8. ビルド
porta build

# 9. 生成されたPageContentViewをSSGで利用
```

#### CLIの役割

| 役割 | 担当 |
|------|------|
| **初期化・生成** | CLI（`init`, `create`, `build`） |
| **バリデーション** | CLI（`validate`） |
| **一覧表示** | CLI（`list`） |
| **編集** | 開発者（エディタで直接JSONを編集） |
| **ビルド・変換** | CLI（`build`） |

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
├── project.json                        # プロジェクト設定
├── media/                              # メディアアセット
└── workspaces/
    └── {workspace-slug}/
        ├── workspace.json              # ワークスペース設定
        ├── build-spec.json             # ビルド仕様（Mapper定義）
        ├── contents/
        │   └── {content-model-slug}/
        │       ├── model.json          # ContentModel定義（ContentListViewStructure含む）
        │       ├── items/              # ContentItem（コンテンツデータ）
        │       │   └── {item-id}.json
        │       └── views/              # 生成されたContentListView
        │           └── {view-slug}/    # ビューごとのディレクトリ
        │               ├── page-1.json  # paginated型の場合
        │               ├── page-2.json
        │               └── data.json    # bounded型の場合
        └── pages/                      # 生成されたPageContentView（BuildSpec実行結果）
            ├── index.json              # Static型の例
            ├── blog/
            │   ├── page-1.json         # Index型の例
            │   ├── page-2.json
            │   └── {slug}.json         # Item型の例
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
