# PortaCMS ドメイン構造

## 概要

このドキュメントは、イベントストーミングの結果として識別された集約（Aggregates）とドメインモデルの構造を説明します。

## ドメインモデル図

### 集約の構造

**Project (プロジェクト)**
- Workspace (ワークスペース) [複数]
  - Website (ウェブサイト)
    - Website Structure (ウェブサイトストラクチャ)
      - Page Content View Structure (ページコンテンツビューストラクチャ) [複数]
  - Content List (コンテンツリスト) [複数]
    - Content List Structure (コンテンツリストストラクチャ)
      - Content Item Structure (コンテンツアイテムストラクチャ)
      - Content List View Structure (コンテンツリストビューストラクチャ)
    - Content Item (コンテンツアイテム) [複数]

**Media Folder (メディアフォルダ)**
- 独立した集約（Project外）
- 複数のWorkspaceから参照可能

**Content List Page Mapper (コンテンツリストページマッパー)**
- 機能: Content List → Page Content View への変換
- カスタムスクリプトによる拡張が可能

**Page Content View (ページコンテンツビュー)**
- SSGビルド時に生成される読み取り専用データ
- ページにバインドされるデータソース

---

## 集約（Aggregates）

### 1. Project (プロジェクト)
**責務**: ワークスペースを包含する最上位の集約

**説明**: 複数のワークスペースを管理し、プロジェクト全体を表現する。

**含まれるエンティティ**:
- Workspace (ワークスペース) - 複数

---

### 2. Workspace (ワークスペース)
**責務**: コンテンツリストや各種ストラクチャ等一式を管理する

**説明**: 本番、開発など、ステージ管理をすることを想定した集約。特定のステージにおけるすべてのコンテンツと設定を包含する。

**含まれるエンティティ**:
- Website (ウェブサイト)
- ContentList (コンテンツリスト) - 複数

**関連**:
- Project に所属

---

### 3. Website (ウェブサイト)
**責務**: ウェブサイト構造の定義と管理

**説明**: ウェブサイトストラクチャをカプセル化する集約。サイト全体の構造とページ構成を定義する。

**含まれるエンティティ**:
- Website Structure (ウェブサイトストラクチャ)
  - Page Content View Structure (ページコンテンツビューストラクチャ) - 複数

**関連**:
- Workspace に所属

---

### 4. ContentList (コンテンツリスト)
**責務**: コンテンツアイテムの集合を管理する

**説明**: 記事、製品、お知らせなど、同じ型のコンテンツアイテムのコレクション。スキーマ定義（Structure）とデータ（Items）の両方を保持する。

**含まれるエンティティ**:
- Content List Structure (コンテンツリストストラクチャ)
  - Content Item Structure (コンテンツアイテムストラクチャ)
  - Content List View Structure (コンテンツリストビューストラクチャ)
- ContentItem (コンテンツアイテム) - 複数

**関連**:
- Workspace に所属

**特性**:
- シングルアイテムまたはマルチアイテムの設定が可能
- JSONスキーマで入力インターフェースを定義
- 設定はプロジェクト間で再利用可能

---

### 5. ContentItem (コンテンツアイテム)
**責務**: 個別のコンテンツデータを保持する

**説明**: 複数のプロパティーの値を持つデータそのもの。例: 記事タイトル、本文、公開日など。

**特性**:
- ContentList に所属
- Content Item Structure によって型が定義される
- プロパティの値を保持

---

### 6. ContentListPageMapper (コンテンツリストページマッパー)
**責務**: ContentListをPageContentViewにマッピングする

**説明**: 変換ロジックを実装するドメインサービス。カスタムスクリプトにより拡張可能。

**入力**: ContentList
**出力**: PageContentView

**特性**:
- イテレーター設定（multipliable pages用）
- コンテキスト変数のバインディング
- カスタムスクリプトのサポート
- singleItemContents、viewsなどの設定による柔軟な変換

---

### 7. PageContentView (ページコンテンツビュー)
**責務**: ウェブサイト生成時にページごとにバインドされるデータを提供する

**説明**: SSGのビルド時に各ページが参照するデータソース。ContentListPageMapperによって動的に生成される読み取り専用データ。

**特性**:
- ContentListPageMapper によって生成される
- Website Structure 内の Page Content View Structure に基づく
- 読み取り専用の生成データ
- SSGビルド時のみ存在

---

## ドメイン関係性

### 階層構造

```
Project
└── Workspace [複数]
    ├── Website
    │   └── Website Structure
    │       └── Page Content View Structure [複数]
    └── ContentList [複数]
        ├── Content List Structure
        │   ├── Content Item Structure
        │   └── Content List View Structure
        └── ContentItem [複数]
```

### ドメインサービスと生成データ

```
ContentListPageMapper (ドメインサービス)
  ↓ 変換
PageContentView (生成データ)
```

### データフロー

```
1. コンテンツ管理フロー:
   Content List Structure (定義)
   → ContentItem (データ)
   → ContentList (コレクション)

2. ページ生成フロー:
   ContentList
   → ContentListPageMapper (変換)
   → PageContentView (出力)
   → SSG (ビルド)
```

---

## 集約の分類

### コア集約（7つ）

1. **Project** - プロジェクト全体の管理
2. **Workspace** - ステージごとの環境管理
3. **Website** - ウェブサイト構造の定義
4. **ContentList** - コンテンツの集合管理
5. **ContentItem** - 個別コンテンツデータ
6. **ContentListPageMapper** - 変換ロジック（ドメインサービス）
7. **PageContentView** - 生成されたページデータ

---

## 設計時 vs 実行時

### 設計時に定義されるもの（Structure）
**集約内のエンティティ**:
- Website Structure
- Page Content View Structure
- Content List Structure
- Content Item Structure
- Content List View Structure
- ContentListPageMapper (ロジック)

**特性**: JSONファイルとして保存され、プロジェクト間で再利用可能

### 実行時に作成・管理されるもの（Data）
**コア集約**:
- Project
- Workspace
- Website
- ContentList
- ContentItem

**特性**: CMSの管理画面で編集され、Gitで管理される

### 実行時に生成されるもの（Output）
**生成データ**:
- PageContentView

**特性**: SSGビルド時に動的に生成される読み取り専用データ

---

## まとめ

PortaCMSのドメインモデルは、**7つのコア集約**で構成されています：

### 集約の役割

| 集約 | 種別 | 役割 |
|------|------|------|
| Project | ルート集約 | プロジェクト全体の管理 |
| Workspace | 集約 | ステージごとの環境管理 |
| Website | 集約 | ウェブサイト構造の定義と管理 |
| ContentList | 集約 | コンテンツとスキーマの管理 |
| ContentItem | エンティティ | 個別コンテンツデータの保持 |
| ContentListPageMapper | ドメインサービス | データ変換ロジック |
| PageContentView | 値オブジェクト | SSG用の生成データ |

### 設計の特徴

1. **階層的な構造**: Project → Workspace → Website/ContentList
2. **スキーマとデータの統合**: ContentListが構造定義とデータの両方を保持
3. **柔軟な変換**: ContentListPageMapperによるカスタマイズ可能なマッピング
4. **ステージ管理**: Workspaceによる環境分離（本番/開発/ステージング）
5. **再利用性**: 構造定義（Structure）のプロジェクト間共有

この設計により、柔軟なカスタマイズ性、設定の再利用性、そして明確なステージ管理を実現しています。
