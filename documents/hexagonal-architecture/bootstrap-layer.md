---
title: Bootstrap層：依存性注入の専用層
---

# 7. Bootstrap層：依存性注入の専用層

> **Bootstrap は依存性注入（DI）の"制御塔"**。アプリケーション起動時に全ての依存関係を解決し、Application 層に注入します。Application 層を純粋に保つために、環境依存の設定やシングルトン管理はこの層に集中させます。

## 7.1. フォルダ・ファイル構造

### 抽象的な構造

```
bootstrap/
├── DIContainer.ts    # DI Container（依存性の解決）
└── index.ts          # ブートストラップのエントリーポイント
```

### 具体例の構造

```
bootstrap/
├── DIContainer.ts    # 依存性注入コンテナ（Repository、Provider、UseCaseの生成）
└── index.ts          # エクスポートのエントリーポイント
```

## 7.2. サンプルコード（全体像）

このセクションでは、Bootstrap 層の実装サンプルを提示します。後続のルールセクションでは、このサンプルの該当箇所を引用して説明します。

### DI Container の実装

```typescript
// bootstrap/DIContainer.ts

import { Firestore, getFirestore } from 'firebase/firestore';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { Application } from '@/application';

// ========================================
// UseCase Imports
// ========================================

import { CreateProjectUseCase } from '@/application/usecases/CreateProjectUseCase';
import { ArchiveProjectUseCase } from '@/application/usecases/ArchiveProjectUseCase';
import { ListProjectsUseCase } from '@/application/usecases/ListProjectsUseCase';

// ========================================
// Driven Port Imports (インターフェース)
// ========================================

import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { UserRepository } from '@/application/driven-ports/UserRepository';
import { ClockPort } from '@/application/driven-ports/ClockPort';
import { IdPort } from '@/application/driven-ports/IdPort';

// ========================================
// Infrastructure Imports (実装)
// ========================================

import { FirestoreProjectRepository } from '@/infrastructure/firestore/adapters/FirestoreProjectRepository';
import { FirestoreUserRepository } from '@/infrastructure/firestore/adapters/FirestoreUserRepository';
import { SystemClock } from '@/infrastructure/providers/SystemClock';
import { UuidGenerator } from '@/infrastructure/providers/UuidGenerator';

// ========================================
// Mock Imports (テスト・開発用)
// ========================================

import { InMemoryProjectRepository } from '@/tests/mocks/InMemoryProjectRepository';
import { InMemoryUserRepository } from '@/tests/mocks/InMemoryUserRepository';

/**
 * DI Container
 * 全ての依存関係をここで解決し、Application に注入する
 */
export class DIContainer {
  // ========================================
  // Firebase 関連のシングルトン
  // ========================================

  private static firebaseApp: FirebaseApp | null = null;
  private static firestore: Firestore | null = null;

  // ========================================
  // Driven Port 実装のシングルトン
  // ========================================

  private static projectRepository: ProjectRepository | null = null;
  private static userRepository: UserRepository | null = null;
  private static clockPort: ClockPort | null = null;
  private static idPort: IdPort | null = null;

  // ========================================
  // Firebase の初期化
  // ========================================

  /**
   * Firebase の初期化
   * 環境変数から設定を読み込み、Firebaseアプリを初期化
   */
  private static initializeFirebase(): void {
    if (this.firebaseApp) return;

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    this.firebaseApp = initializeApp(firebaseConfig);
    this.firestore = getFirestore(this.firebaseApp);
  }

  /**
   * Firestore インスタンスを取得
   */
  private static getFirestore(): Firestore {
    if (!this.firestore) {
      this.initializeFirebase();
    }
    return this.firestore!;
  }

  // ========================================
  // Repository の取得（環境に応じて実装を切り替え）
  // ========================================

  /**
   * ProjectRepository を取得（Singleton）
   * 環境変数に基づいて、Firebase または Mock 実装を返す
   */
  private static getProjectRepository(): ProjectRepository {
    if (!this.projectRepository) {
      const useMock = import.meta.env.VITE_USE_MOCK_REPOSITORIES === 'true';

      if (useMock) {
        // Mock実装を使用（テスト・開発用）
        this.projectRepository = new InMemoryProjectRepository();
      } else {
        // Firebase実装を使用（本番用）
        const firestore = this.getFirestore();
        this.projectRepository = new FirestoreProjectRepository(firestore);
      }
    }
    return this.projectRepository;
  }

  /**
   * UserRepository を取得（Singleton）
   */
  private static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      const useMock = import.meta.env.VITE_USE_MOCK_REPOSITORIES === 'true';

      if (useMock) {
        this.userRepository = new InMemoryUserRepository();
      } else {
        const firestore = this.getFirestore();
        this.userRepository = new FirestoreUserRepository(firestore);
      }
    }
    return this.userRepository;
  }

  // ========================================
  // Provider の取得
  // ========================================

  /**
   * ClockPort を取得（Singleton）
   */
  private static getClockPort(): ClockPort {
    if (!this.clockPort) {
      this.clockPort = new SystemClock();
    }
    return this.clockPort;
  }

  /**
   * IdPort を取得（Singleton）
   */
  private static getIdPort(): IdPort {
    if (!this.idPort) {
      this.idPort = new UuidGenerator();
    }
    return this.idPort;
  }

  // ========================================
  // UseCase の生成
  // ========================================

  /**
   * CreateProjectUseCase を生成
   */
  private static createCreateProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(
      this.getProjectRepository(),
      this.getIdPort()
    );
  }

  /**
   * ArchiveProjectUseCase を生成
   */
  private static createArchiveProjectUseCase(): ArchiveProjectUseCase {
    return new ArchiveProjectUseCase(
      this.getProjectRepository(),
      this.getClockPort()
    );
  }

  /**
   * ListProjectsUseCase を生成
   */
  private static createListProjectsUseCase(): ListProjectsUseCase {
    return new ListProjectsUseCase(
      this.getProjectRepository()
    );
  }

  // ========================================
  // Application の生成（エントリーポイント）
  // ========================================

  /**
   * Application を生成
   * すべての UseCase を注入して Application インスタンスを返す
   */
  static createApplication(): Application {
    return new Application(
      this.createCreateProjectUseCase(),
      this.createArchiveProjectUseCase(),
      this.createListProjectsUseCase()
    );
  }

  // ========================================
  // テスト用ユーティリティ
  // ========================================

  /**
   * テスト用：依存関係をリセット
   */
  static reset(): void {
    this.firebaseApp = null;
    this.firestore = null;
    this.projectRepository = null;
    this.userRepository = null;
    this.clockPort = null;
    this.idPort = null;
  }

  /**
   * テスト用：依存関係を上書き
   */
  static override(overrides: {
    projectRepository?: ProjectRepository;
    userRepository?: UserRepository;
    clockPort?: ClockPort;
    idPort?: IdPort;
  }): void {
    if (overrides.projectRepository) this.projectRepository = overrides.projectRepository;
    if (overrides.userRepository) this.userRepository = overrides.userRepository;
    if (overrides.clockPort) this.clockPort = overrides.clockPort;
    if (overrides.idPort) this.idPort = overrides.idPort;
  }
}
```

### エントリーポイントでの使用例

```typescript
// bootstrap/index.ts

export { DIContainer } from './DIContainer';
```

```typescript
// main.ts（アプリケーションのエントリーポイント）

import { DIContainer } from '@/bootstrap';

// ========================================
// アプリケーションの初期化
// ========================================

// Application インスタンスを生成
const application = DIContainer.createApplication();

// Presentation 層で使用
// 例: application.createProject.execute({ ... })
```

### テストでの使用例

```typescript
// tests/setup.ts

import { DIContainer } from '@/bootstrap/DIContainer';
import { InMemoryProjectRepository } from '@/tests/mocks/InMemoryProjectRepository';
import { FixedClock } from '@/tests/mocks/FixedClock';

// ========================================
// テストセットアップ
// ========================================

beforeEach(() => {
  // テストごとに依存関係をリセット
  DIContainer.reset();

  // Mock実装を注入
  DIContainer.override({
    projectRepository: new InMemoryProjectRepository(),
    clockPort: new FixedClock(new Date('2024-01-01T00:00:00Z')),
  });
});
```

## 7.3. ルール1: Bootstrap 層は依存性注入のみに特化する

* **説明:** Bootstrap 層の唯一の責務は、**依存性の解決と注入**です。Repository の実装選択、環境変数の読み込み、Provider の生成、UseCase の組み立てなど、すべての DI 関連処理をここに集約します。
* **意図:**
  * Application 層を純粋に保つ（環境依存を持ち込まない）
  * テスト時の依存関係差し替えを容易にする
  * 起動時の設定を1箇所で管理
* **該当サンプル:**
  * `bootstrap/DIContainer.ts`
  詳細な実装は「[DI Container の実装](#di-container-の実装)」を参照。

```typescript
// bootstrap/DIContainer.ts（抜粋）

export class DIContainer {
  private static projectRepository: ProjectRepository | null = null;
  private static clockPort: ClockPort | null = null;

  private static getProjectRepository(): ProjectRepository {
    if (!this.projectRepository) {
      const useMock = import.meta.env.VITE_USE_MOCK_REPOSITORIES === 'true';
      // 環境変数に基づいて実装を切り替え
      this.projectRepository = useMock
        ? new InMemoryProjectRepository()
        : new FirestoreProjectRepository(this.getFirestore());
    }
    return this.projectRepository;
  }

  static createApplication(): Application {
    // すべての依存関係を解決して Application を生成
    return new Application(
      this.createCreateProjectUseCase(),
      this.createArchiveProjectUseCase(),
      // ...
    );
  }
}
```

### チェックリスト

* ✅ DI Container は Bootstrap 層に配置されているか？
* ✅ 環境変数の読み込みは Bootstrap 層でのみ行われているか？
* ✅ Repository や Provider の実装選択は DI Container で行われているか？

### アンチパターン

* ❌ Application 層で DI Container を持つ（Bootstrap 層の責務）
* ❌ Presentation 層で Repository を直接インスタンス化する（DI Container を経由すべき）

## 7.4. ルール2: DI Container は全ての依存関係を解決する

* **説明:** DI Container は、以下の依存関係を解決します：
  * **Repository の実装**: 環境変数に基づいて、Firestore/InMemory実装を選択
  * **Provider の実装**: ClockPort, IdPort などの実装を提供
  * **UseCase の生成**: Application 層の UseCase 実装を生成
  * **Application の生成**: 全ての UseCase を注入した Application インスタンスを生成
* **意図:** 依存関係の複雑さを Bootstrap 層に隔離し、他の層をシンプルに保ちます。
* **該当サンプル:**
  * `bootstrap/DIContainer.ts`
  詳細な実装は「[DI Container の実装](#di-container-の実装)」を参照。

```typescript
// bootstrap/DIContainer.ts（抜粋）

// Repository の取得
private static getProjectRepository(): ProjectRepository {
  if (!this.projectRepository) {
    const useMock = import.meta.env.VITE_USE_MOCK_REPOSITORIES === 'true';
    this.projectRepository = useMock
      ? new InMemoryProjectRepository()
      : new FirestoreProjectRepository(this.getFirestore());
  }
  return this.projectRepository;
}

// UseCase の生成
private static createArchiveProjectUseCase(): ArchiveProjectUseCase {
  return new ArchiveProjectUseCase(
    this.getProjectRepository(),
    this.getClockPort()
  );
}

// Application の生成
static createApplication(): Application {
  return new Application(
    this.createCreateProjectUseCase(),
    this.createArchiveProjectUseCase(),
    this.createListProjectsUseCase()
  );
}
```

### チェックリスト

* ✅ すべての Repository は DI Container で生成されているか？
* ✅ すべての Provider は DI Container で生成されているか？
* ✅ すべての UseCase は DI Container で生成されているか？
* ✅ Application は DI Container で生成されているか？

### アンチパターン

* ❌ UseCase 内で Repository を直接 new する（DI Container から注入すべき）
* ❌ 複数の箇所で Repository インスタンスを生成する（シングルトンにすべき）

## 7.5. ルール3: Application は DIContainer.createApplication() で取得する

* **説明:** Application インスタンスは、`DIContainer.createApplication()` を呼び出して取得します。このメソッドは、すべての依存関係を解決し、完全に構成された Application を返します。
* **意図:**
  * 依存関係の構築ロジックを一箇所に集約
  * Application の生成方法を統一
  * テストと本番で同じインターフェースを使用
* **該当サンプル:**
  * `bootstrap/DIContainer.ts`
  * `main.ts`
  詳細な実装は「[DI Container の実装](#di-container-の実装)」および「[エントリーポイントでの使用例](#エントリーポイントでの使用例)」を参照。

```typescript
// main.ts（抜粋）

import { DIContainer } from '@/bootstrap';

// Application インスタンスを生成
const application = DIContainer.createApplication();

// Presentation 層で使用
// 例: application.createProject.execute({ ... })
```

### チェックリスト

* ✅ Application の取得は DIContainer.createApplication() を使用しているか？
* ✅ Application インスタンスはアプリケーション起動時に一度だけ生成されているか？
* ✅ Application インスタンスは適切にPresentation層に渡されているか？

### アンチパターン

* ❌ 各コンポーネントで DIContainer.createApplication() を呼ぶ（起動時に一度だけ生成すべき）
* ❌ Application を new Application() で直接インスタンス化する（DI Container を使うべき）

## 7.6. ルール4: テストでは DI Container を上書きする

* **説明:** テスト時には、`DIContainer.override()` を使って、Mock実装を注入します。テストの前に `DIContainer.reset()` で依存関係をリセットし、テスト間の状態漏れを防ぎます。
* **意図:** テストの独立性を保ち、外部依存なしでユニットテストを実行できるようにします。
* **該当サンプル:**
  * `tests/setup.ts`
  詳細な実装は「[テストでの使用例](#テストでの使用例)」を参照。

```typescript
// tests/setup.ts（抜粋）

beforeEach(() => {
  // テストごとに依存関係をリセット
  DIContainer.reset();

  // Mock実装を注入
  DIContainer.override({
    projectRepository: new InMemoryProjectRepository(),
    clockPort: new FixedClock(new Date('2024-01-01T00:00:00Z')),
  });
});
```

### チェックリスト

* ✅ DIContainer に reset() メソッドが実装されているか？
* ✅ DIContainer に override() メソッドが実装されているか？
* ✅ テストの beforeEach で reset() を呼んでいるか？
* ✅ テストで必要な依存関係を override() で注入しているか？

### アンチパターン

* ❌ テスト間で依存関係をリセットせず、状態が漏れる
* ❌ テストで本番の Repository 実装を使う（Mock を使うべき）
* ❌ 各テストケースで個別に依存関係を構築する（beforeEach で統一すべき）

## 7.7. ルール5: 環境変数は Bootstrap 層でのみ読み込む

* **説明:** 環境変数（`import.meta.env.*`, `process.env.*`）の読み込みは、**Bootstrap 層でのみ**行います。他の層では環境変数に直接アクセスしません。
* **意図:**
  * 環境依存を Bootstrap 層に隔離
  * テスト時の環境変数のモックが容易
  * 環境変数の読み込み場所を1箇所に集約
* **該当サンプル:**
  * `bootstrap/DIContainer.ts`
  詳細な実装は「[DI Container の実装](#di-container-の実装)」を参照。

```typescript
// bootstrap/DIContainer.ts（抜粋）

private static initializeFirebase(): void {
  if (this.firebaseApp) return;

  // 環境変数の読み込みは Bootstrap 層でのみ
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    // ...
  };

  this.firebaseApp = initializeApp(firebaseConfig);
  this.firestore = getFirestore(this.firebaseApp);
}
```

### チェックリスト

* ✅ 環境変数の読み込みは Bootstrap 層でのみ行われているか？
* ✅ Application 層が環境変数に直接アクセスしていないか？
* ✅ Infrastructure 層が環境変数に直接アクセスしていないか？
* ✅ Domain 層が環境変数に直接アクセスしていないか？
* ✅ Presentation 層が環境変数に直接アクセスしていないか？

### アンチパターン

* ❌ Application 層で `import.meta.env.*` を読み込む
* ❌ Infrastructure 層で `import.meta.env.*` を読み込む
* ❌ Domain 層で `import.meta.env.*` を読み込む
* ❌ Presentation 層で `import.meta.env.*` を読み込む

## 7.8. ルール6: Presentation 層への Application の提供方法は Presentation 層が決定する

* **説明:** Bootstrap 層は Application インスタンスを生成するのみで、それを Presentation 層にどのように提供するか（React Context、グローバル変数、依存性注入フレームワークなど）は **Presentation 層の責務** です。
* **意図:**
  * Bootstrap 層を UI フレームワークから独立させる
  * 異なる UI フレームワーク（React、Vue、Svelte など）に対応可能にする
  * Bootstrap 層の責務を依存性注入のみに限定
* **該当サンプル:**
  * `main.ts`
  詳細な実装は「[エントリーポイントでの使用例](#エントリーポイントでの使用例)」を参照。

```typescript
// main.ts（抜粋）

import { DIContainer } from '@/bootstrap';

// Bootstrap層: Application を生成
const application = DIContainer.createApplication();

// Presentation層の責務: Application を提供
// 例1: React Context を使う場合（Presentation層で実装）
// <ApplicationProvider value={application}>...</ApplicationProvider>

// 例2: グローバル変数として提供する場合
// window.app = application;

// 例3: DI フレームワークに登録する場合
// container.register('application', application);
```

### チェックリスト

* ✅ Bootstrap 層は Application の生成のみを担当しているか？
* ✅ Application の提供方法（Context、グローバル変数など）は Presentation 層で決定されているか？
* ✅ Bootstrap 層に UI フレームワーク固有のコード（React、Vue など）が含まれていないか？

### アンチパターン

* ❌ Bootstrap 層で React Context を定義する（Presentation 層の責務）
* ❌ Bootstrap 層で UI フレームワーク固有のコードを含む（フレームワーク非依存であるべき）
* ❌ Bootstrap 層で Presentation 層のコンポーネントを import する（依存方向が逆）
