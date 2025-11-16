---
title: Domain層：純粋なビジネスロジックの聖域
---

# 4. Domain層：純粋なビジネスロジックの聖域

> **Domain は「アプリの心臓部」。** 入出力やUI/フレームワークの事情から切り離し、純粋な型・規約・ロジックだけで構成します。DDD（ドメイン駆動設計）と Functional Programming の原則に基づき、不変性と純粋関数を重視します。

## 4.1. フォルダ・ファイル構造

### 抽象的な構造

```
domain/
└── {AggregateName}/
    ├── entities.ts    # すべてのEntity（完全版とサブセット）
    ├── commands.ts    # すべてのCommands（Write操作の純粋関数）
    └── queries.ts     # すべてのQuery（Read操作の純粋関数）
```

### 具体例の構造

```
domain/
└── Project/
    ├── entities.ts    # Project, ProjectSummary など
    ├── commands.ts    # archiveProject, renameProject など
    └── queries.ts     # calculateProjectCost など
```

## 4.2. サンプルコード（全体像）

このセクションでは、Domain層の実装サンプルを提示します。後続のルールセクションでは、このサンプルの該当箇所を引用して説明します。

### entities.ts のサンプル

```typescript
// domain/Project/entities.ts
import { z } from 'zod';

// ========================================
// 完全な Entity スキーマ
// ========================================
export const ProjectSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
  name: z.string().min(1, 'Project name cannot be empty'),
  status: z.enum(['active', 'archived']),
  description: z.string(),
  ownerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

// ファクトリ関数（不変な値を返す）
export function createProject(input: {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}): Project {
  const now = new Date();
  return ProjectSchema.parse({
    ...input,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// Entity サブセット（一覧表示用）
// ========================================
export const ProjectSummarySchema = ProjectSchema.pick({
  id: true,
  name: true,
  status: true,
  updatedAt: true,
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

// ========================================
// エラー定義
// ========================================
// サブセットから完全なEntityへのアクセスを試みた場合のエラー
export class IncompleteEntityAccessError extends Error {
  constructor(entityType: string, missingField: string) {
    super(`Cannot access field '${missingField}' on incomplete ${entityType}. This field was not loaded.`);
    this.name = 'IncompleteEntityAccessError';
  }
}
```

### commands.ts のサンプル

```typescript
// domain/Project/commands.ts
import { Project } from './entities';

// ========================================
// エラー定義
// ========================================
export class ProjectAlreadyArchivedError extends Error {
  constructor() {
    super('Project is already archived.');
    this.name = 'ProjectAlreadyArchivedError';
  }
}

// ========================================
// Archive Project Command
// ========================================
export interface ArchiveProjectParams {
  archivedBy: string;
  archivedAt: Date;
}

export interface ArchiveProjectResult {
  nextState: Project;
  patch: Partial<Project>;
}

// 純粋関数: (prevState, params) => { nextState, patch }
export function archiveProject(
  prevState: Project,
  params: ArchiveProjectParams
): ArchiveProjectResult {
  if (prevState.status === 'archived') {
    throw new ProjectAlreadyArchivedError();
  }

  const patch: Partial<Project> = {
    status: 'archived',
    updatedAt: params.archivedAt,
  };

  const nextState: Project = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Rename Project Command
// ========================================
export interface RenameProjectParams {
  newName: string;
  updatedAt: Date;
}

export interface RenameProjectResult {
  nextState: Project;
  patch: Partial<Project>;
}

export function renameProject(
  prevState: Project,
  params: RenameProjectParams
): RenameProjectResult {
  if (!params.newName.trim()) {
    throw new Error('Project name cannot be empty');
  }

  const patch: Partial<Project> = {
    name: params.newName,
    updatedAt: params.updatedAt,
  };

  const nextState: Project = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}
```

### queries.ts のサンプル

```typescript
// domain/Project/queries.ts
import { Project } from './entities';

// ========================================
// Calculate Project Cost Query
// ========================================
export interface CalculateProjectCostParams {
  basePrice: number;
  discountRate: number;
}

export interface ProjectCost {
  basePrice: number;
  discount: number;
  finalPrice: number;
}

// 純粋関数: (state, params) => result
export function calculateProjectCost(
  project: Project,
  params: CalculateProjectCostParams
): ProjectCost {
  const basePrice = params.basePrice;
  const discount = basePrice * params.discountRate;
  const finalPrice = basePrice - discount;

  return {
    basePrice,
    discount,
    finalPrice,
  };
}
```

## 4.3. ルール1: Aggregates はビジネスの整合性境界を定義する

* **説明:** Aggregate は、**関連する Entity と Value Object をまとめた整合性の境界**です。Aggregate は以下を内包します：
  * **Entity（不変オブジェクト）**: ビジネスの中核データ
  * **Commands（書き込み操作）**: 状態変更を行う純粋関数
  * **Query（読み込み操作）**: 状態から情報を取得する純粋関数
* **意図:** ビジネスルールの一貫性を保証し、変更の影響範囲を明確にします。Aggregate 単位でトランザクション境界が決まります。
* **該当サンプル:**
  * `domain/Project/entities.ts` - Entity の定義
  * `domain/Project/commands.ts` - Commands の定義
  * `domain/Project/queries.ts` - Query の定義

  詳細な実装は「[4.2. サンプルコード（全体像）](#42-サンプルコード全体像)」を参照。

### チェックリスト

* ✅ Aggregate 単位でフォルダを分割しているか？
* ✅ 各 Aggregate に `entities.ts`, `commands.ts`, `queries.ts` の3ファイルがあるか？
* ✅ Aggregate が他の Aggregate を直接参照していないか？

### アンチパターン

* ❌ Aggregate が他の Aggregate を直接参照する（ID参照を使用する）
* ❌ Domain 層に Port や UseCase を配置する（Application 層に配置すべき）

## 4.4. ルール2: Entity は不変オブジェクトであり、常に完全であることを期待する

* **説明:** Entity は **Immutable Object** として定義します。スキーマ（例: `zod`）で型を定義し、生成時に自己検証を行います。Entity は常に**完全な状態**を持つことを期待しますが、特定のユースケースでは**サブセット（部分的な Entity）** を作成できます。
* **意図:**
  * 不変性により、予期しない副作用を防ぎ、並行処理の安全性を確保
  * 常に正しい値が流れる状態を保証
  * サブセットにより、不要なデータ取得を回避し、パフォーマンスを最適化
* **該当サンプル:**
  * `domain/Project/entities.ts` - Entity の定義とファクトリ関数、サブセットの定義

  詳細な実装は「[entities.ts のサンプル](#entitiests-のサンプル)」を参照。

### チェックリスト

* ✅ Entity は不変オブジェクトとして定義されているか？
* ✅ Entity のサブセットを適切に使用しているか？
* ✅ ファクトリ関数でスキーマバリデーションを行っているか？

### アンチパターン

* ❌ Entity に setter メソッドを持たせる（可変オブジェクトにしない）
* ❌ Entity を直接変更する（Commands を使用する）

## 4.5. ルール3: Commands は状態変更を行う純粋関数である

* **説明:** Commands は `(prevState, params) => { nextState, patch }` という形式の**純粋関数**です。副作用を持たず、前の状態とパラメータから、次の状態と差分（patch）を計算して返します。
* **意図:**
  * 予測可能性とテスト容易性を最大化
  * 状態の変更履歴（patch）を保持可能
  * Optimistic UI や Event Sourcing との相性が良い
* **該当サンプル:**
  * `domain/Project/commands.ts` - archiveProject, renameProject などの Command 関数

  詳細な実装は「[commands.ts のサンプル](#commandsts-のサンプル)」を参照。

```typescript
// domain/Project/commands.ts（抜粋）
// 純粋関数: (prevState, params) => { nextState, patch }
export function archiveProject(
  prevState: Project,
  params: ArchiveProjectParams
): ArchiveProjectResult {
  // ...ビジネスロジック
  return { nextState, patch };
}
```

### チェックリスト

* ✅ Commands は `(prevState, params) => { nextState, patch }` の形式か？
* ✅ Commands は副作用を持たない純粋関数か？
* ✅ patch（差分）を返しているか？

### アンチパターン

* ❌ Commands が副作用を持つ（I/O、ログ出力など）（純粋関数にする）
* ❌ Domain 層で `Date.now()` や `Math.random()` を直接使用する（パラメータとして受け取る）

## 4.6. ルール4: Query は状態から情報を取得する純粋関数である

* **説明:** Query は `(state, params) => result` という形式の**純粋関数**です。状態を変更せず、読み取り専用の操作を行います。
* **意図:**
  * 読み取り操作と書き込み操作を明確に分離（CQRS パターン）
  * 副作用なしでテストが容易
* **該当サンプル:**
  * `domain/Project/queries.ts` - calculateProjectCost などの Query 関数

  詳細な実装は「[queries.ts のサンプル](#queriests-のサンプル)」を参照。

```typescript
// domain/Project/queries.ts（抜粋）
// 純粋関数: (state, params) => result
export function calculateProjectCost(
  project: Project,
  params: CalculateProjectCostParams
): ProjectCost {
  // ...計算ロジック
  return { basePrice, discount, finalPrice };
}
```

### チェックリスト

* ✅ Query は `(state, params) => result` の形式か？
* ✅ Query は状態を変更していないか？
* ✅ Query は副作用を持たない純粋関数か？

### アンチパターン

* ❌ Query が状態を変更する（Commands を使用する）
* ❌ Query が副作用を持つ（I/O、ログ出力など）（純粋関数にする）

## 4.7. ルール5: Domain 層は外部技術に依存しない

* **説明:** Domain 層は、HTTP、データベース、フレームワークなどの外部技術に依存してはいけません。純粋な TypeScript/JavaScript の型とロジックのみで構成します。
* **意図:**
  * ビジネスロジックの再利用性とテスト容易性を最大化
  * 技術スタックの変更に強い設計
  * ビジネスルールの可視化と理解の容易さ
* **該当サンプル:**
  * 上記のすべてのサンプルコードは、外部技術に依存していません
  * `zod` のようなバリデーションライブラリは Domain 層で使用可能です（純粋な型定義とバリデーションのため）

### チェックリスト

* ✅ Domain 層が外部技術（HTTP/DB など）に依存していないか？
* ✅ Domain 層が Port や Repository を直接持っていないか？
* ✅ Domain 層が Application 層や Infrastructure 層をインポートしていないか？

### アンチパターン

* ❌ Domain 層で HTTP クライアントを使用する（Application/Infrastructure 層で使用する）
* ❌ Domain 層で ORM を使用する（Infrastructure 層で使用する）
* ❌ Domain 層で Port や Repository を定義する（Application 層で定義する）
