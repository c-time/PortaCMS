---
title: Infrastructure層：外部依存の隔離
---

# 5. Infrastructure層：外部依存の隔離

> **Infrastructure は副作用の"防波堤"**。HTTP/DB/ストレージ/ブラウザAPIなどの具体技術をここに閉じ込め、Domain が純粋であり続けるよう守ります。

## 5.1. フォルダ・ファイル構造

### 抽象的な構造

```
infrastructure/
├── {datastore-type}/
│   ├── adapters/
│   │   └── {DataStoreType}{Entity}Repository.ts    # Repository Driven Port の実装
│   └── schemas/
│       └── {Entity}DocSchema.ts                     # データストア固有のスキーマ定義
├── http/
│   ├── HttpClient.ts                                # HTTP通信の基盤クラス
│   └── HttpClientFactory.ts                         # HttpClient の生成ファクトリ
└── providers/
    ├── SystemClock.ts                               # ClockPort の Provider 実装
    └── UuidGenerator.ts                             # IdPort の Provider 実装
```

### 具体例の構造

```
infrastructure/
├── firestore/
│   ├── adapters/
│   │   └── FirestoreProjectRepository.ts    # ProjectRepository Driven Port の Firestore 実装
│   └── schemas/
│       └── ProjectDocSchema.ts              # Firestore ドキュメントのスキーマ
├── http/
│   ├── HttpClient.ts                        # 汎用HTTPクライアント
│   └── HttpClientFactory.ts                 # HttpClient 生成ロジック
└── providers/
    ├── SystemClock.ts                       # ClockPort の Provider 実装
    └── UuidGenerator.ts                     # IdPort の Provider 実装
```

## 5.2. サンプルコード（全体像）

このセクションでは、Infrastructure層の実装サンプルを提示します。後続のルールセクションでは、このサンプルの該当箇所を引用して説明します。

### HttpClient の実装

```typescript
// infrastructure/http/HttpClient.ts

// ========================================
// HTTP オプション定義
// ========================================

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;        // 失敗時の再試行回数（GET/PUTなど冪等操作に限定）
  retryDelayMs?: number;   // 再試行間隔
  signal?: AbortSignal;
};

// ========================================
// エラー型定義
// ========================================

export class HttpError extends Error {
  constructor(
    public status: number,
    public body?: unknown,
    message?: string
  ) {
    super(message ?? `HTTP ${status}`);
  }
}

export class TimeoutError extends Error {}

// ========================================
// HttpClient クラス
// ========================================

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultHeaders: () => Record<string, string> = () => ({})
  ) {}

  async request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeoutMs = 10_000,
      retries = 0,
      retryDelayMs = 400,
      signal
    } = opts;
    const url = this.baseUrl + path;

    for (let attempt = 0; ; attempt++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...this.defaultHeaders(),
            ...headers
          },
          body: body == null ? undefined : JSON.stringify(body),
          signal: signal ?? ac.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          const text = await res.text().catch(() => undefined);
          // レート制限エラーの場合はリトライ
          if (res.status === 429 && attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
            continue;
          }
          throw new HttpError(res.status, text);
        }

        // JSON 以外も許容する場合は content-type 判定
        const ct = res.headers.get('content-type') || '';
        return (ct.includes('application/json')
          ? (await res.json())
          : (await res.text())) as T;

      } catch (e) {
        clearTimeout(timer);

        if (e instanceof DOMException && e.name === 'AbortError') {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
            continue;
          }
          throw new TimeoutError();
        }

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelayMs));
          continue;
        }
        throw e;
      }
    }
  }
}
```

### Repository Adapter の実装

```typescript
// infrastructure/firestore/adapters/FirestoreProjectRepository.ts

import { Project, ProjectSchema, ProjectSummary, ProjectSummarySchema } from '@/domain/Project/entities';
import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { ProjectDocSchema } from '../schemas/ProjectDocSchema';

// ========================================
// Repository Adapter クラス
// ========================================

// Application層のDriven Portを実装（Firestore ⇄ Domain 型の変換と検証を担う）
export class FirestoreProjectRepository implements ProjectRepository {
  constructor(private readonly firestore: Firestore) {}

  // ========================================
  // Query メソッド（複数）
  // ========================================

  // Query メソッド1: ID による取得
  async findById(id: string): Promise<Project | null> {
    const docRef = doc(this.firestore, 'projects', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    // Firestoreドキュメント → Domain型への変換 + 検証
    const firestoreData = snapshot.data();
    const validated = ProjectDocSchema.parse(firestoreData);

    return ProjectSchema.parse({
      id: validated.id,
      name: validated.project_name,
      status: validated.status,
      description: validated.description,
      ownerId: validated.owner_id,
      createdAt: validated.created_at.toDate(),
      updatedAt: validated.updated_at.toDate(),
    });
  }

  // Query メソッド2: ユーザーIDによる検索（サマリーのみ）
  async findByUserId(userId: string): Promise<ProjectSummary[]> {
    const q = query(
      collection(this.firestore, 'projects'),
      where('owner_id', '==', userId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return ProjectSummarySchema.parse({
        id: data.id,
        name: data.project_name,
        status: data.status,
        updatedAt: data.updated_at.toDate(),
      });
    });
  }

  // Query メソッド3: 一覧取得（サマリーのみ）
  async list(options?: { limit?: number; offset?: number }): Promise<ProjectSummary[]> {
    const colRef = collection(this.firestore, 'projects');
    const snapshot = await getDocs(colRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return ProjectSummarySchema.parse({
        id: data.id,
        name: data.project_name,
        status: data.status,
        updatedAt: data.updated_at.toDate(),
      });
    });
  }

  // Query メソッド4: 検索
  async search(searchQuery: string): Promise<ProjectSummary[]> {
    // 実装例（単純な名前検索）
    const snapshot = await getDocs(collection(this.firestore, 'projects'));

    return snapshot.docs
      .map(doc => doc.data())
      .filter(data => data.project_name.includes(searchQuery))
      .map(data => ProjectSummarySchema.parse({
        id: data.id,
        name: data.project_name,
        status: data.status,
        updatedAt: data.updated_at.toDate(),
      }));
  }

  // ========================================
  // Save メソッド（1つのみ）
  // ========================================

  // Save メソッド: 作成・更新を統一
  async save(project: Project): Promise<void> {
    const docRef = doc(this.firestore, 'projects', project.id);

    // Domain型 → Firestoreドキュメント形式への変換
    const firestoreData = {
      id: project.id,
      project_name: project.name,
      status: project.status,
      description: project.description,
      owner_id: project.ownerId,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };

    // setDoc は作成と更新の両方を処理
    await setDoc(docRef, firestoreData);
  }
}
```

### データストアスキーマの定義

```typescript
// domain/Project/entities.ts (Domain層の定義)

import { z } from 'zod';

// ========================================
// Domain Entity Schema
// ========================================

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(['active', 'archived']),
  description: z.string(),
  ownerId: z.string().uuid(),
  createdAt: z.date(), // DomainではDate型として扱う
  updatedAt: z.date(),
});
export type Project = z.infer<typeof ProjectSchema>;
```

```typescript
// infrastructure/firestore/schemas/ProjectDocSchema.ts (Infrastructure層の定義)

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore'; // Firestore固有の型
import { ProjectSchema } from '@/domain/Project/entities';

// ========================================
// Firestore Document Schema
// ========================================

// Firestoreのドキュメント構造に対応するスキーマ
export const ProjectDocSchema = z.object({
  // Domainのスキーマから一部を流用・上書き
  id: ProjectSchema.shape.id,
  project_name: z.string().min(1), // データストア固有のフィールド名（スネークケース）
  status: ProjectSchema.shape.status,
  description: ProjectSchema.shape.description,
  owner_id: z.string().uuid(), // データストア固有のフィールド名（スネークケース）
  created_at: z.instanceof(Timestamp), // データストア固有の型
  updated_at: z.instanceof(Timestamp),
});
export type ProjectDoc = z.infer<typeof ProjectDocSchema>;
```

### Provider の実装

```typescript
// infrastructure/providers/SystemClock.ts

import { ClockPort } from '@/application/driven-ports/ClockPort';

// ========================================
// ClockPort の Provider 実装
// ========================================

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
```

```typescript
// infrastructure/providers/UuidGenerator.ts

import { IdPort } from '@/application/driven-ports/IdPort';
import { v4 as uuidv4 } from 'uuid';

// ========================================
// IdPort の Provider 実装
// ========================================

export class UuidGenerator implements IdPort {
  uuid(): string {
    return uuidv4();
  }
}
```

### 設定の注入とファクトリ

```typescript
// infrastructure/http/HttpClientFactory.ts

import { HttpClient } from './HttpClient';

// ========================================
// HttpClient Factory
// ========================================

// このFactoryは環境変数に直接アクセスせず、引数で受け取る
export class HttpClientFactory {
  // baseUrl などは上位の Bootstrap 層から注入される
  static create(
    baseUrl: string,
    getAuthToken?: () => string | null
  ): HttpClient {
    if (!baseUrl) {
      throw new Error('API base URL must be provided.');
    }

    const defaultHeaders = () => {
      if (!getAuthToken) return {};
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    return new HttpClient(baseUrl, defaultHeaders);
  }
}
```

## 5.3. ルール1: Adapter は Application 層の Driven Port を実装し、入出力を**マッピング + 検証**する

* **説明:** Adapter は Application 層で定義した Driven Port（インターフェース）を **実装**し、外部フォーマット ⇄ Domain 型の **変換**と **スキーマ検証**（例: `zod`）を担います。外部の生データ・HTTP レスポンスをそのまま上位に返しません。
* **Repository パターン:**
  * **Query メソッド（複数）**: 用途別に複数のクエリメソッドを実装
    * 例: `findById()`, `findByUserId()`, `list()`, `search()`
  * **Save メソッド（1つ）**: 作成・更新を統一した1つの save メソッドのみ
    * `save(entity)` で作成と更新の両方を処理
* **意図:** 外部仕様の変更の影響範囲を Infrastructure に限定し、Domain／UseCase の安定性を確保するためです。
* **該当サンプル:**
  * `infrastructure/firestore/adapters/FirestoreProjectRepository.ts`
  詳細な実装は「[Repository Adapter の実装](#repository-adapter-の実装)」を参照。

```typescript
// infrastructure/firestore/adapters/FirestoreProjectRepository.ts（抜粋）

// Application層のDriven Portを実装（Firestore ⇄ Domain 型の変換と検証を担う）
export class FirestoreProjectRepository implements ProjectRepository {
  constructor(private readonly firestore: Firestore) {}

  // Query メソッド1: ID による取得
  async findById(id: string): Promise<Project | null> {
    // Firestoreドキュメント → Domain型への変換 + 検証
    const firestoreData = snapshot.data();
    const validated = ProjectDocSchema.parse(firestoreData);

    return ProjectSchema.parse({
      id: validated.id,
      name: validated.project_name, // フィールド名の変換
      // ...
    });
  }

  // Save メソッド（1つのみ）: 作成・更新を統一
  async save(project: Project): Promise<void> {
    // Domain型 → Firestoreドキュメント形式への変換
    const firestoreData = {
      id: project.id,
      project_name: project.name, // フィールド名の変換
      // ...
    };

    await setDoc(docRef, firestoreData);
  }
}
```

### チェックリスト

* ✅ Adapter は Application 層の Driven Port インターフェースを実装しているか？
* ✅ 外部データを Domain 型に変換する際、zod などでスキーマ検証を行っているか？
* ✅ Repository には複数の Query メソッドと、1つの save メソッドのみが定義されているか？

### アンチパターン

* ❌ 外部データをそのまま上位に返す（必ず Domain 型に変換してから返す）
* ❌ save メソッドを create/update に分割する（save メソッド1つで統一する）

## 5.4. ルール2: データベーススキーマは zod 等を用いて schemas に定義する

* **説明:** データベースなどデータストア固有のデータ構造は、`infrastructure/{datastore-type}/schemas` ディレクトリに zod 等を用いてスキーマとして定義します。これらのスキーマは、データストア上の表現（例: Firestore の Timestamp 型やスネークケースのフィールド名）を正確にモデル化します。Domain層のエンティティスキーマに依存して、拡張または合成することは許容されます。
* **意図:** データストアの物理的なスキーマと、Domain層の論理的なエンティティモデルを分離するためです。これにより、データストアの都合をInfrastructure層に閉じ込め、Domain層の純粋性を保ちます。Adapterでのデータマッピング処理の信頼性も高まります。
* **該当サンプル:**
  * `infrastructure/firestore/schemas/ProjectDocSchema.ts`
  * `domain/Project/entities.ts`
  詳細な実装は「[データストアスキーマの定義](#データストアスキーマの定義)」を参照。

```typescript
// infrastructure/firestore/schemas/ProjectDocSchema.ts（抜粋）

import { Timestamp } from 'firebase/firestore'; // Firestore固有の型
import { ProjectSchema } from '@/domain/Project/entities';

// Firestoreのドキュメント構造に対応するスキーマ
export const ProjectDocSchema = z.object({
  // Domainのスキーマから一部を流用・上書き
  id: ProjectSchema.shape.id,
  project_name: z.string().min(1), // データストア固有のフィールド名
  created_at: z.instanceof(Timestamp), // データストア固有の型
  // ...
});
```

### チェックリスト

* ✅ データストアのスキーマは `infrastructure/{datastore-type}/schemas` に配置されているか？
* ✅ データストア固有の型（Timestamp など）やフィールド名（スネークケース）を正確にモデル化しているか?
* ✅ Domain 層のエンティティスキーマと Infrastructure 層のスキーマが適切に分離されているか？

### アンチパターン

* ❌ Domain 層のスキーマをデータストアの都合に合わせて変更する（Infrastructure 層で吸収する）
* ❌ データストア固有のスキーマ定義を省略する（必ず明示的に定義する）

## 5.5. ルール3: Adapter に**ビジネスロジックを持ち込まない**

* **説明:** Adapter の責務は **I/O と変換** のみ。状態遷移やドメイン規則の判断（例: アーカイブ可否判定、名称の検証）は **Domain Functions / UseCase** に委譲します。
* **意図:** 責務の混在を防ぎ、技術交換（HTTP→gRPC、DB→別ベンダー）を容易にします。
* **該当サンプル:**
  * `infrastructure/firestore/adapters/FirestoreProjectRepository.ts`
  詳細な実装は「[Repository Adapter の実装](#repository-adapter-の実装)」を参照。

### チェックリスト

* ✅ Adapter はデータの取得・保存・変換のみを行い、ビジネスロジックを含んでいないか？
* ✅ 状態遷移や検証ロジックは Domain Functions や UseCase に委譲されているか？

### アンチパターン

* ❌ Adapter 内で状態遷移の判定を行う（Domain Functions に委譲する）
* ❌ Adapter 内でビジネスルールに基づくバリデーションを行う（Domain 層に委譲する）

## 5.6. ルール4: **障害に強い I/O**（タイムアウト/リトライ/キャンセル/レート制限）

* **説明:** すべての外部呼び出しは **タイムアウト** を設定し、冪等な操作に限定して **指数バックオフ付きリトライ** を行います。ユーザー操作中断には **AbortController** でキャンセル対応を行い、`429` や明確なレート制限応答には **待機して再試行** します。
* **実装ポイント:**
  * リトライは **GET/PUT** など冪等な操作に限る（POST は idempotency-key を使用）
  * タイムアウトは用途ごとにプロファイル化（UI 操作とバッチで閾値を分ける）
  * コンカレンシー制御（リクエストの重複送信防止・最新勝ち）
* **意図:** ネットワークゆらぎに強い UX と、安定した運用を両立するためです。
* **該当サンプル:**
  * `infrastructure/http/HttpClient.ts`
  詳細な実装は「[HttpClient の実装](#httpclient-の実装)」を参照。

```typescript
// infrastructure/http/HttpClient.ts（抜粋）

async request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, retries = 0, retryDelayMs = 400, signal } = opts;

  for (let attempt = 0; ; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs); // タイムアウト設定

    try {
      const res = await fetch(url, { signal: signal ?? ac.signal });

      if (res.status === 429 && attempt < retries) {
        // レート制限エラーの場合はリトライ
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }
      // ...
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof DOMException && e.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelayMs)); // リトライ
          continue;
        }
        throw new TimeoutError();
      }
      // ...
    }
  }
}
```

### チェックリスト

* ✅ すべての外部呼び出しにタイムアウトが設定されているか？
* ✅ 冪等な操作（GET/PUT）でのみリトライが実装されているか？
* ✅ AbortController を使用してユーザー操作の中断に対応しているか？
* ✅ レート制限（429）に対して適切な待機とリトライを行っているか？

### アンチパターン

* ❌ タイムアウトを設定せずに外部呼び出しを行う（必ずタイムアウトを設定する）
* ❌ 非冪等な操作（POST）で無条件にリトライする（idempotency-key を使用する）

## 5.7. ルール5: **エラー変換**（外部 → ドメイン語彙 / インフラ語彙）

* **説明:** 生の HTTP ステータスや外部エラー文言をそのまま上位に漏らしません。`404→null`、`401/403→Unauthorized`、`409→Conflict`、`429→RateLimit` など、**意味のある型/例外**に変換します。
* **意図:** UseCase／UI が "何が起きたか" を理解しやすくし、分岐が簡潔になります。
* **該当サンプル:**
  * `infrastructure/http/HttpClient.ts`
  詳細な実装は「[HttpClient の実装](#httpclient-の実装)」を参照。

```typescript
// infrastructure/http/HttpClient.ts（抜粋）

export class HttpError extends Error {
  constructor(
    public status: number,
    public body?: unknown,
    message?: string
  ) {
    super(message ?? `HTTP ${status}`);
  }
}

export class TimeoutError extends Error {}

// request メソッド内
if (!res.ok) {
  const text = await res.text().catch(() => undefined);
  throw new HttpError(res.status, text); // 意味のある例外に変換
}
```

### チェックリスト

* ✅ HTTP ステータスコードを意味のある例外型に変換しているか？
* ✅ UseCase や UI が理解しやすいエラー型を提供しているか？

### アンチパターン

* ❌ 生の HTTP ステータスコードをそのまま上位に返す（例外型に変換する）
* ❌ 外部エラーメッセージをそのまま表示する（アプリケーション固有のエラーに変換する）

## 5.8. ルール6: 設定とシークレットはコンストラクタ経由で注入する

* **説明:** baseURL やAPIキーのような設定値やシークレットは、コードに直接書き込まず、Bootstrap 層で環境変数や外部の設定ファイルから読み込みます。Infrastructure層のクラス（Adapter, HttpClient, Providerなど）は、これらの値をコンストラクタを通じて外部から受け取ることで、環境変数への直接アクセスを回避します。
* **意図:** 依存性の注入（DI）の原則に従い、Infrastructure層を特定の環境から完全に分離します。これにより、テストが容易になり（モックを注入できる）、異なる環境（開発、ステージング、本番）での再利用性が向上します。
* **該当サンプル:**
  * `infrastructure/http/HttpClientFactory.ts`
  * `infrastructure/providers/SystemClock.ts`
  * `infrastructure/providers/UuidGenerator.ts`
  詳細な実装は「[設定の注入とファクトリ](#設定の注入とファクトリ)」および「[Provider の実装](#provider-の実装)」を参照。

```typescript
// infrastructure/http/HttpClientFactory.ts（抜粋）

export class HttpClientFactory {
  // baseUrl などは上位の Bootstrap 層から注入される
  static create(
    baseUrl: string,
    getAuthToken?: () => string | null
  ): HttpClient {
    if (!baseUrl) {
      throw new Error('API base URL must be provided.');
    }

    const defaultHeaders = () => {
      if (!getAuthToken) return {};
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    return new HttpClient(baseUrl, defaultHeaders);
  }
}
```

### チェックリスト

* ✅ Infrastructure 層のクラスは環境変数に直接アクセスしていないか？
* ✅ 設定値やシークレットはコンストラクタ経由で注入されているか？
* ✅ ファクトリクラスは上位層から設定値を受け取っているか？

### アンチパターン

* ❌ Infrastructure 層で直接 `process.env` にアクセスする（上位層から注入する）
* ❌ 設定値をクラス内でハードコードする（コンストラクタで注入する）
