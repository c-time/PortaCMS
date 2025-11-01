---
title: Bootstrap層：依存性注入の専用層
---

# 7. Bootstrap層：依存性注入の専用層

> **Bootstrap は依存性注入（DI）の"制御塔"**。アプリケーション起動時に全ての依存関係を解決し、Application 層に注入します。Application 層を純粋に保つために、環境依存の設定やシングルトン管理はこの層に集中させます。

## 7.1. ルール1: Bootstrap 層は依存性注入のみに特化する

* **説明:** Bootstrap 層の唯一の責務は、**依存性の解決と注入**です。Repository の実装選択、環境変数の読み込み、シングルトンの管理など、すべての DI 関連処理をここに集約します。
* **意図:**
  * Application 層を純粋に保つ（環境依存を持ち込まない）
  * テスト時の依存関係差し替えを容易にする
  * 起動時の設定を1箇所で管理
* **フォルダ構造:**

```
bootstrap/
├── DIContainer.ts          # DI Container（依存性の解決）
├── ApplicationContext.tsx  # React Context（Application の提供）
└── index.ts                # ブートストラップのエントリーポイント
```

## 7.2. ルール2: DI Container は全ての依存関係を解決する

* **説明:** DI Container は、以下の依存関係を解決します：
  * **Repository の実装**: 環境変数に基づいて、Firebase/Mock実装を選択
  * **Port の実装**: ClockPort, IdPort などの実装を提供
  * **Facade の生成**: Application 層の Facade 実装を生成
  * **Application の生成**: 全ての Facade を注入した Application インスタンスを生成
* **意図:** 依存関係の複雑さを Bootstrap 層に隔離し、他の層をシンプルに保ちます。
* **サンプル**

```typescript
// bootstrap/DIContainer.ts
import { Firestore, getFirestore } from 'firebase/firestore';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { Application } from '@/application';
import { ProjectFacade } from '@/presentation/facades/ProjectFacade';
import { UserFacade } from '@/presentation/facades/UserFacade';
import { ProjectFacadeImpl } from '@/application/facades/ProjectFacadeImpl';
import { UserFacadeImpl } from '@/application/facades/UserFacadeImpl';
import { ProjectRepository } from '@/application/ports/ProjectRepository';
import { UserRepository } from '@/application/ports/UserRepository';
import { ClockPort } from '@/application/ports/ClockPort';
import { IdPort } from '@/application/ports/IdPort';
import { ProjectRepositoryAdapter } from '@/infrastructure/firestore/adapters/ProjectRepositoryAdapter';
import { UserRepositoryAdapter } from '@/infrastructure/firestore/adapters/UserRepositoryAdapter';
import { ClockAdapter } from '@/infrastructure/adapters/ClockAdapter';
import { IdAdapter } from '@/infrastructure/adapters/IdAdapter';

/**
 * DI Container
 * 全ての依存関係をここで解決し、Application に注入する
 */
export class DIContainer {
  private static firebaseApp: FirebaseApp | null = null;
  private static firestore: Firestore | null = null;

  // Singletons
  private static projectRepository: ProjectRepository | null = null;
  private static userRepository: UserRepository | null = null;
  private static clockPort: ClockPort | null = null;
  private static idPort: IdPort | null = null;

  /**
   * Firebase の初期化
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

  /**
   * ProjectRepository を取得（Singleton）
   */
  private static getProjectRepository(): ProjectRepository {
    if (!this.projectRepository) {
      const useMock = import.meta.env.VITE_USE_MOCK_REPOSITORIES === 'true';

      if (useMock) {
        // Mock実装を使用（テスト・開発用）
        this.projectRepository = new ProjectRepositoryMock();
      } else {
        // Firebase実装を使用（本番用）
        const firestore = this.getFirestore();
        this.projectRepository = new ProjectRepositoryAdapter(firestore);
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
        this.userRepository = new UserRepositoryMock();
      } else {
        const firestore = this.getFirestore();
        this.userRepository = new UserRepositoryAdapter(firestore);
      }
    }
    return this.userRepository;
  }

  /**
   * ClockPort を取得（Singleton）
   */
  private static getClockPort(): ClockPort {
    if (!this.clockPort) {
      this.clockPort = new ClockAdapter();
    }
    return this.clockPort;
  }

  /**
   * IdPort を取得（Singleton）
   */
  private static getIdPort(): IdPort {
    if (!this.idPort) {
      this.idPort = new IdAdapter();
    }
    return this.idPort;
  }

  /**
   * ProjectFacade を生成
   */
  private static createProjectFacade(): ProjectFacade {
    return new ProjectFacadeImpl(
      this.getProjectRepository(),
      this.getIdPort(),
      this.getClockPort()
    );
  }

  /**
   * UserFacade を生成
   */
  private static createUserFacade(): UserFacade {
    return new UserFacadeImpl(
      this.getUserRepository(),
      this.getClockPort()
    );
  }

  /**
   * Application を生成（エントリーポイント）
   */
  static createApplication(): Application {
    return new Application(
      this.createProjectFacade(),
      this.createUserFacade()
    );
  }

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

## 7.3. ルール3: React Context で Application を提供する

* **説明:** React アプリケーションでは、**React Context** を使って、Bootstrap 層で生成した Application インスタンスを Presentation 層に提供します。
* **意図:** グローバルな依存関係を Props のバケツリレーなしで提供し、コンポーネントツリー全体で Application にアクセス可能にします。
* **サンプル**

```typescript
// bootstrap/ApplicationContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { Application } from '@/application';
import { DIContainer } from './DIContainer';

const ApplicationContext = createContext<Application | null>(null);

/**
 * ApplicationProvider
 * Application インスタンスを生成し、Context で提供する
 */
export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const app = useMemo(() => DIContainer.createApplication(), []);

  return (
    <ApplicationContext.Provider value={app}>
      {children}
    </ApplicationContext.Provider>
  );
}

/**
 * useApplication Hook
 * Presentation 層から Application にアクセスするためのフック
 */
export function useApplication(): Application {
  const app = useContext(ApplicationContext);
  if (!app) {
    throw new Error('useApplication must be used within ApplicationProvider');
  }
  return app;
}
```

## 7.4. ルール4: エントリーポイントで ApplicationProvider をセットアップ

* **説明:** アプリケーションのエントリーポイント（`main.tsx`）で、`ApplicationProvider` をセットアップします。
* **意図:** アプリケーション起動時に、依存関係を一度だけ解決し、全体で共有します。
* **サンプル**

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApplicationProvider } from './bootstrap/ApplicationContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApplicationProvider>
      <App />
    </ApplicationProvider>
  </React.StrictMode>
);
```

## 7.5. ルール5: テストでは DI Container を上書きする

* **説明:** テスト時には、`DIContainer.override()` を使って、Mock実装を注入します。
* **意図:** テストの独立性を保ち、外部依存なしでユニットテストを実行できるようにします。
* **サンプル**

```typescript
// tests/setup.ts
import { DIContainer } from '@/bootstrap/DIContainer';
import { ProjectRepositoryMock } from '@/tests/mocks/ProjectRepositoryMock';
import { ClockMock } from '@/tests/mocks/ClockMock';

beforeEach(() => {
  // テストごとに依存関係をリセット
  DIContainer.reset();

  // Mock実装を注入
  DIContainer.override({
    projectRepository: new ProjectRepositoryMock(),
    clockPort: new ClockMock(),
  });
});
```

## 7.6. ルール6: 環境変数は Bootstrap 層でのみ読み込む

* **説明:** 環境変数（`import.meta.env.*`, `process.env.*`）の読み込みは、**Bootstrap 層でのみ**行います。他の層では環境変数に直接アクセスしません。
* **意図:**
  * 環境依存を Bootstrap 層に隔離
  * テスト時の環境変数のモックが容易
  * 環境変数の読み込み場所を1箇所に集約
* **アンチパターン:**
  * ❌ Application 層で `import.meta.env.*` を読み込む
  * ❌ Infrastructure 層で `import.meta.env.*` を読み込む
  * ❌ Domain 層で `import.meta.env.*` を読み込む

## チェックリスト

1. ✅ DI Container は Bootstrap 層に配置されているか？
2. ✅ Application 層が環境変数に直接アクセスしていないか？
3. ✅ React Context で Application を提供しているか？
4. ✅ エントリーポイントで ApplicationProvider をセットアップしているか？
5. ✅ テスト用の依存関係上書き機能があるか？
6. ✅ 環境変数の読み込みが Bootstrap 層のみか？

## アンチパターン

* ❌ Application 層で DI Container を持つ
* ❌ Presentation 層で環境変数を読み込む
* ❌ Infrastructure 層で環境変数を読み込む
* ❌ グローバル変数を使って Application を共有する
* ❌ テストで依存関係をリセットせず、状態が漏れる
