---
title: Infrastructure層：外部依存の隔離
---

# 5. Infrastructure層：外部依存の隔離

> **Infrastructure は副作用の"防波堤"**。HTTP/DB/ストレージ/ブラウザAPIなどの具体技術をここに閉じ込め、Domain が純粋であり続けるよう守ります。

## 5.1. ルール1: Adapter は Domain 層の Port を実装し、入出力を**マッピング + 検証**する

* **説明:** Adapter は Domain で定義した Port（インターフェース）を **実装**し、外部フォーマット ⇄ Domain 型の **変換**と **スキーマ検証**（例: `zod`）を担います。外部の生データ・HTTP レスポンスをそのまま上位に返しません。
* **Repository パターン:**
  * **Query メソッド（複数）**: 用途別に複数のクエリメソッドを実装
    * 例: `findById()`, `findByUserId()`, `list()`, `search()`
  * **Save メソッド（1つ）**: 作成・更新を統一した1つの save メソッドのみ
    * `save(entity)` で作成と更新の両方を処理
* **意図:** 外部仕様の変更の影響範囲を Infrastructure に限定し、Domain／UseCase の安定性を確保するためです。
* **サンプル**

```typescript
// infrastructure/http/HttpClient.ts
export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;        // 失敗時の再試行回数（GET/PUTなど冪等操作に限定）
  retryDelayMs?: number;   // 再試行間隔
  signal?: AbortSignal;
};

export class HttpError extends Error { constructor(public status: number, public body?: unknown, message?: string){ super(message ?? `HTTP ${status}`);} }
export class TimeoutError extends Error {}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultHeaders: () => Record<string, string> = () => ({})
  ) {}

  async request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, timeoutMs = 10_000, retries = 0, retryDelayMs = 400, signal } = opts;
    const url = this.baseUrl + path;

    for (let attempt = 0; ; attempt++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...this.defaultHeaders(), ...headers },
          body: body == null ? undefined : JSON.stringify(body),
          signal: signal ?? ac.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          const text = await res.text().catch(() => undefined);
          if (res.status === 429 && attempt < retries) { await new Promise(r => setTimeout(r, retryDelayMs)); continue; }
          throw new HttpError(res.status, text);
        }
        // JSON 以外も許容する場合は content-type 判定
        const ct = res.headers.get('content-type') || '';
        return (ct.includes('application/json') ? (await res.json()) : (await res.text())) as T;
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof DOMException && e.name === 'AbortError') {
          if (attempt < retries) { await new Promise(r => setTimeout(r, retryDelayMs)); continue; }
          throw new TimeoutError();
        }
        if (attempt < retries) { await new Promise(r => setTimeout(r, retryDelayMs)); continue; }
        throw e;
      }
    }
  }
}
```

```typescript
// infrastructure/firestore/adapters/ProjectRepositoryAdapter.ts
import { Project, ProjectSchema, ProjectSummary, ProjectSummarySchema } from '@/domain/Project/entities';
import { ProjectRepository } from '@/application/ports/ProjectRepository';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { ProjectDocSchema } from '../schemas/ProjectDocSchema';

// Domain層の Port を実装（Firestore ⇄ Domain 型の変換と検証を担う）
export class ProjectRepositoryAdapter implements ProjectRepository {
  constructor(private readonly firestore: Firestore) {}

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

  // Save メソッド（1つのみ）: 作成・更新を統一
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

## 5.2. ルール2: データベーススキーマは zod 等を用いて schemas に定義する
* **説明:** データベースなどデータストア固有のデータ構造は、infrastructure/{datastore type}/schemas ディレクトリに zod 等を用いてスキーマとして定義します。これらのスキーマは、データストア上の表現（例: Firestore の Timestamp 型やスネークケースのフィールド名）を正確にモデル化します。Domain層のエンティティスキーマに依存して、拡張または合成することは許容されます。

* **意図:** データストアの物理的なスキーマと、Domain層の論理的なエンティティモデルを分離するためです。これにより、データストアの都合をInfrastructure層に閉じ込め、Domain層の純粋性を保ちます。Adapterでのデータマッピング処理の信頼性も高まります。

* **サンプル**

```typescript
// domain/Project/entities.ts (Domain層の定義)
import { z } from 'zod';

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


## 5.3. ルール3: Adapter に**ビジネスロジックを持ち込まない**

* **説明:** Adapter の責務は **I/O と変換** のみ。状態遷移やドメイン規則の判断（例: アーカイブ可否判定、名称の検証）は **Domain Functions / UseCase** に委譲します。
* **意図:** 責務の混在を防ぎ、技術交換（HTTP→gRPC、DB→別ベンダー）を容易にします。

## 5.4. ルール4: **障害に強い I/O**（タイムアウト/リトライ/キャンセル/レート制限）

* **説明:** すべての外部呼び出しは **タイムアウト** を設定し、冪等な操作に限定して **指数バックオフ付きリトライ** を行います。ユーザー操作中断には **AbortController** でキャンセル対応を行い、`429` や明確なレート制限応答には **待機して再試行** します。
* **意図:** ネットワークゆらぎに強い UX と、安定した運用を両立するためです。
* **実装ポイント:**

  * リトライは **GET/PUT** など冪等な操作に限る（POST は idempotency-key を使用）
  * タイムアウトは用途ごとにプロファイル化（UI 操作とバッチで閾値を分ける）
  * コンカレンシー制御（リクエストの重複送信防止・最新勝ち）

## 5.5. ルール5: **エラー変換**（外部 → ドメイン語彙 / インフラ語彙）

* **説明:** 生の HTTP ステータスや外部エラー文言をそのまま上位に漏らしません。`404→null`、`401/403→Unauthorized`、`409→Conflict`、`429→RateLimit` など、**意味のある型/例外**に変換します。
* **意図:** UseCase／UI が "何が起きたか" を理解しやすくし、分岐が簡潔になります。

## 5.6. ルール6: 設定とシークレットはコンストラクタ経由で注入する

* **説明:** baseURL やAPIキーのような設定値やシークレットは、コードに直接書き込まず、Application層で環境変数や外部の設定ファイルから読み込みます。Infrastructure層のクラス（Adapter, HttpClientなど）は、これらの値をコンストラクタを通じて外部から受け取ることで、環境変数への直接アクセスを回避します。
* **意図:** 依存性の注入（DI）の原則に従い、Infrastructure層を特定の環境から完全に分離します。これにより、テストが容易になり（モックを注入できる）、異なる環境（開発、ステージング、本番）での再利用性が向上します。
* **サンプル**

```typescript
// infrastructure/http/HttpClientFactory.ts
import { HttpClient } from './HttpClient';
import { TokenStorage } from '../ports/TokenStorage';

// このFactoryは環境変数に直接アクセスせず、引数で受け取る
export class HttpClientFactory {
  // baseUrl と tokenStorage は上位の Application 層から注入される
  static create(baseUrl: string, tokenStorage: TokenStorage): HttpClient {
    if (!baseUrl) {
      throw new Error('API base URL must be provided.');
    }

    const defaultHeaders = () => {
      const token = tokenStorage.getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    return new HttpClient(baseUrl, defaultHeaders);
  }
}
```

```typescript
// infrastructure/adapters/storage/TokenStorageAdapter.ts
import { TokenStorage } from '../../ports/TokenStorage';

// Portの具体的な実装
export class TokenStorageAdapter implements TokenStorage {
  private readonly TOKEN_KEY = 'authToken';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(this.TOKEN_KEY);
  }

  saveToken(token: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.TOKEN_KEY, token);
  }
}
```