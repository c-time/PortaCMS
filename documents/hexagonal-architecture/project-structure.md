# 2. プロジェクトの設計図：構造化されたアーキテクチャの基盤

## 2.1. プロジェクトの設計図

### ルール1: ディレクトリ構造はレイヤーを物理的に表現する

* **説明:** プロジェクトのフォルダ構成は、論理レイヤー（Domain / Application / Infrastructure / Presentation）を**物理的な階層**として表現します。開発者は「どこに何があるか」を迷わず辿れ、レイヤー境界を越える依存が自然に抑制されます。
* **意図:** レイヤーの責務を**ディレクトリ構造で強制**することで、予測可能性・可読性・変更容易性を高めます。新規参画メンバーのオンボーディング速度も向上します。
* **標準構成:**

```text
app/
├── specs/              # 仕様駆動開発（Spec Driven Development）
│   └── {YYYYMMDD}-{feature-name}/
│       ├── requirements.md  # 要件定義
│       ├── design.md        # 設計仕様
│       └── tasks.md         # タスク定義
└── src/
    ├── domain/         # ビジネスの中核（Aggregates, UseCases）
    │   ├── {Aggregate1}/   # Aggregate単位でフォルダ分割
    │   │   ├── entities.ts # すべてのEntity（完全版とサブセット）
    │   │   ├── commands.ts # すべてのCommands（Write操作の純粋関数）
    │   │   └── queries.ts  # すべてのQuery（Read操作の純粋関数）
    │   ├── {Aggregate2}/
    │   └── usecases/       # UseCase（Aggregateをまたぐワークフロー）
    ├── application/    # Application層（Facade実装）
    │   ├── ports/      # Portインターフェース（Repository等）
    │   ├── facades/    # Facade実装（Presentation層のインターフェースを実装）
    │   └── index.ts    # Application クラス
    ├── infrastructure/ # 外部システムとの接続
    │   └── {data store type e.g. firestore}/
    │       ├── schemas/  # データベーススキーマ
    │       └── adapters/ # port の実装
    ├── presentation/   # UI
    │   ├── facades/          # Facadeインターフェース（Presentation層が定義）
    │   ├── App.tsx           # Application Component（ApplicationContextに依存）
    │   ├── ErrorBoundary.tsx # エラーハンドリング
    │   ├── Router.tsx        # ルーティング
    │   ├── {XXXPage}.tsx     # ページコンポーネント（ルート直下、Propsなし）
    │   └── compoundComponents/ # Compound Components
    │       └── {ComponentName}/
    │           ├── index.tsx    # メインコンポーネント（状態管理 + 子供への受け渡し）
    │           ├── adapter.ts   # Application Adapter（hooks）
    │           ├── model.ts     # View Model（型定義）
    │           └── {ChildComponent}.tsx # Child Component（表示専用）
    └── bootstrap/      # 依存性注入専用層
        ├── DIContainer.ts       # DI Container
        ├── ApplicationContext.tsx # React Context
        └── index.ts             # エントリーポイント
```

* **依存ルール（方向）:**

  * `presentation → bootstrap → application → domain`
  * `infrastructure → domain`（※ Domain に**依存しない**形で実装しない）
  * `bootstrap → application + infrastructure`（依存性の解決）
  * `presentation` と `infrastructure` の**相互依存禁止**
* **チェックリスト:**

  1. 新規ファイルの置き場所が、レイヤー責務と一致しているか？
  2. tsconfig の `paths` / ESLint の import ルールで**越境インポート**を検知できるか？
  3. `presentation` から `infrastructure` を直接 import していないか？
  4. ルートレベルの index からの**バレル輸出**で責務境界が曖昧になっていないか？
* **アンチパターン:**

  * `utils/` に何でも置く汎用フォルダを作る。
  * `presentation` から `fetch`/SDK を直接叩くために `infrastructure` を import。
  * `domain` が `infrastructure` の型や実装に依存する（方向逆転）。

### ルール2: ファイル名は役割を明示する

* **説明:** ファイル名は **PascalCase** を基本とし、役割に応じた **Suffix** を付与します。開かなくても役割が分かることを狙います。
* **意図:** 名前から責務・粒度を推測できるようにし、探索コストと認知負荷を下げます。
* **命名表:**

| 役割             | 接尾辞（例）                          | ファイル名サンプル                  |
| :------------- | :------------------------------ | :------------------------- |
| エンティティ         | （なし）                            | `Project.ts`, `User.ts`    |
| エンティティサブセット    | `Summary`, `Detail` など          | `ProjectSummary.ts`        |
| Commands       | `Command`                       | `ArchiveProjectCommand.ts` |
| Query          | `Query`                         | `CalculateProjectCostQuery.ts` |
| ユースケース         | `UseCase`                       | `ArchiveProjectUseCase.ts` |
| ポート（リポジトリ等）    | `Repository`, `Port`            | `ProjectRepository.ts`, `ClockPort.ts` |
| アダプター          | `Adapter`                       | `ProjectRepositoryAdapter.ts` |
| スキーマ           | `Schema`, `DocSchema`           | `ProjectDocSchema.ts`      |
| Facade         | `Facade`, `FacadeImpl`          | `ProjectFacade.ts`, `ProjectFacadeImpl.ts` |
| Compound Component | （フォルダ名）                      | `ProjectCard/index.tsx`          |
| View Model     | `model.ts`                      | `ProjectCard/model.ts` |
| Adapter        | `adapter.ts`                    | `ProjectCard/adapter.ts` |
| Child Component | （なし）                           | `ProjectCardHeader.tsx` |
| Page コンポーネント | `Page`                           | `ProjectListPage.tsx` |
| Application Component | （なし）                       | `App.tsx`, `Router.tsx` |

* **補足規約:**

  * `index.ts` の乱用禁止。**名前付きエクスポート**で役割を明示する。
  * テストは `*.spec.ts[x]` / `*.test.ts[x]`。ストーリーは `*.stories.tsx`。
  * 生成ファイルやビルド成果物は `dist/` 配下に限定。
* **チェックリスト:**

  1. 名称から「レイヤー」「役割」「粒度」が分かるか？
  2. 似た役割のファイルで **Suffix の揺れ**が無いか？
  3. バレル経由で役割が不明瞭になっていないか？
* **アンチパターン:**

  * `helper.ts`, `utils.ts` のような**意味の薄い汎用名**。
  * `index.tsx` のデフォルトエクスポートに実体を隠す。