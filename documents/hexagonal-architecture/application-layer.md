---
title: Application層：UseCase と Driver/Driven Port の境界
---

# 6. Application層：UseCase と Driver/Driven Port の境界

> **Application は外部からの入力を受け付け、ビジネスロジックを実行し、外部システムに出力する"窓口"。** Driver Port（入力インターフェース）と Driven Port（出力インターフェース）を定義し、UseCase の実装を提供します。依存性注入（DI）は Bootstrap 層に委譲し、Application 層は純粋に保ちます。

## 6.1. フォルダ・ファイル構造

### 抽象的な構造

```
application/
├── usecases/                          # UseCase実装（driver-portsの実装）
│   ├── {UseCase1}UseCase.ts
│   └── {UseCase2}UseCase.ts
├── driver-ports/                      # Driver Portインターフェース（外部からの入力）
│   ├── {UseCase1}DriverPort.ts
│   └── {UseCase2}DriverPort.ts
├── driven-ports/                      # Driven Portインターフェース（外部への出力）
│   ├── {Aggregate}Repository.ts
│   ├── ClockPort.ts
│   └── IdPort.ts
└── index.ts                           # Application クラス

domain/
├── {Aggregate1}/
│   ├── entities.ts                    # Entity定義
│   ├── commands.ts                    # Command（Write操作の純粋関数）
│   └── queries.ts                     # Query（Read操作の純粋関数）
└── {Aggregate2}/
    ├── entities.ts
    ├── commands.ts
    └── queries.ts

infrastructure/
└── {DataStoreType}/
    ├── schemas/                       # データベーススキーマ
    │   └── {Aggregate}DocSchema.ts
    └── adapters/                      # Driven Portの実装
        └── {DataStoreType}{Aggregate}Repository.ts

bootstrap/
├── DIContainer.ts                     # DI Container
└── ApplicationContext.tsx             # React Context
```

### 具体例の構造

```
application/
├── usecases/
│   ├── CreateProjectUseCase.ts       # プロジェクト作成UseCase実装
│   ├── ArchiveProjectUseCase.ts      # プロジェクトアーカイブUseCase実装
│   └── RenameProjectUseCase.ts       # プロジェクト名変更UseCase実装
├── driver-ports/
│   ├── CreateProjectDriverPort.ts    # プロジェクト作成のDriver Port
│   ├── ArchiveProjectDriverPort.ts   # プロジェクトアーカイブのDriver Port
│   └── ListProjectsDriverPort.ts     # プロジェクト一覧取得のDriver Port
├── driven-ports/
│   ├── ProjectRepository.ts          # Projectの永続化インターフェース
│   ├── UserRepository.ts             # Userの永続化インターフェース
│   ├── ClockPort.ts                  # 時刻取得のインターフェース
│   └── IdPort.ts                     # ID生成のインターフェース
└── index.ts                          # Applicationエントリーポイント

domain/
├── Project/
│   ├── entities.ts                   # Project, ProjectSummary等
│   ├── commands.ts                   # archiveProject, renameProject等
│   └── queries.ts                    # calculateProjectCost等
└── User/
    ├── entities.ts
    ├── commands.ts
    └── queries.ts

infrastructure/
└── firestore/
    ├── schemas/
    │   └── ProjectDocSchema.ts       # Firestoreスキーマ定義
    └── adapters/
        └── FirestoreProjectRepository.ts  # ProjectRepositoryの実装

bootstrap/
├── DIContainer.ts
└── ApplicationContext.tsx
```

## 6.2. サンプルコード（全体像）

このセクションでは、Application 層の実装サンプルを提示します。後続のルールセクションでは、このサンプルの該当箇所を引用して説明します。

### Driver Port インターフェース（Application層）

```typescript
// application/driver-ports/CreateProjectDriverPort.ts

import { Project } from '@/domain/Project/entities';

// ========================================
// Driver Port定義（外部からの入力インターフェース）
// ========================================

/**
 * CreateProjectDriverPort インターフェース
 * Presentation 層が使用する入力ポート
 */
export interface CreateProjectDriverPort {
  execute(input: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Project>;
}
```

```typescript
// application/driver-ports/ArchiveProjectDriverPort.ts

// ========================================
// Driver Port定義（外部からの入力インターフェース）
// ========================================

export interface ArchiveProjectDriverPort {
  execute(projectId: string, archivedBy: string): Promise<void>;
}
```

```typescript
// application/driver-ports/ListProjectsDriverPort.ts

import { ProjectSummary } from '@/domain/Project/entities';

// ========================================
// Driver Port定義（外部からの入力インターフェース）
// ========================================

export interface ListProjectsDriverPort {
  execute(): Promise<ProjectSummary[]>;
}
```

### Driven Port インターフェース（Application層）

```typescript
// application/driven-ports/ProjectRepository.ts

import { Project, ProjectSummary } from '@/domain/Project/entities';

// ========================================
// Driven Port定義（外部への出力インターフェース）
// ========================================

export interface ProjectRepository {
  // Query メソッド（複数）
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<ProjectSummary[]>;
  list(options?: { limit?: number; offset?: number }): Promise<ProjectSummary[]>;
  search(query: string): Promise<ProjectSummary[]>;

  // Save メソッド（1つ）
  save(project: Project): Promise<void>;
}
```

```typescript
// application/driven-ports/ClockPort.ts

// ========================================
// Driven Port定義（時刻取得）
// ========================================

export interface ClockPort {
  now(): Date;
}
```

```typescript
// application/driven-ports/IdPort.ts

// ========================================
// Driven Port定義（ID生成）
// ========================================

export interface IdPort {
  uuid(): string;
}
```

### UseCase実装（Application層）

```typescript
// application/usecases/CreateProjectUseCase.ts

import { CreateProjectDriverPort } from '@/application/driver-ports/CreateProjectDriverPort';
import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { IdPort } from '@/application/driven-ports/IdPort';
import { Project, createProject } from '@/domain/Project/entities';

// ========================================
// UseCase実装（Driver Portの実装）
// ========================================

/**
 * CreateProjectUseCase
 * プロジェクト作成のワークフローを実装
 */
export class CreateProjectUseCase implements CreateProjectDriverPort {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly idPort: IdPort
  ) {}

  async execute(input: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Project> {
    // 1. Domain のファクトリ関数で Entity を作成
    const project = createProject({
      id: this.idPort.uuid(),
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
    });

    // 2. Repository に保存
    await this.projectRepo.save(project);

    return project;
  }
}
```

```typescript
// application/usecases/ArchiveProjectUseCase.ts

import { ArchiveProjectDriverPort } from '@/application/driver-ports/ArchiveProjectDriverPort';
import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { ClockPort } from '@/application/driven-ports/ClockPort';
import { archiveProject } from '@/domain/Project/commands';

// ========================================
// カスタムエラー定義
// ========================================

export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found.');
    this.name = 'ProjectNotFoundError';
  }
}

// ========================================
// UseCase実装（Driver Portの実装）
// ========================================

export class ArchiveProjectUseCase implements ArchiveProjectDriverPort {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly clock: ClockPort
  ) {}

  async execute(projectId: string, archivedBy: string): Promise<void> {
    // 1. Repository から Entity を取得
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    // 2. Domain Command を実行（純粋関数）
    const { nextState } = archiveProject(project, {
      archivedBy,
      archivedAt: this.clock.now(),
    });

    // 3. Repository に保存
    await this.projectRepo.save(nextState);
  }
}
```

```typescript
// application/usecases/ListProjectsUseCase.ts

import { ListProjectsDriverPort } from '@/application/driver-ports/ListProjectsDriverPort';
import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { ProjectSummary } from '@/domain/Project/entities';

// ========================================
// UseCase実装（Driver Portの実装）
// ========================================

export class ListProjectsUseCase implements ListProjectsDriverPort {
  constructor(
    private readonly projectRepo: ProjectRepository
  ) {}

  async execute(): Promise<ProjectSummary[]> {
    return this.projectRepo.list();
  }
}
```

### Applicationエントリーポイント（Application層）

```typescript
// application/index.ts

import { CreateProjectDriverPort } from '@/application/driver-ports/CreateProjectDriverPort';
import { ArchiveProjectDriverPort } from '@/application/driver-ports/ArchiveProjectDriverPort';
import { ListProjectsDriverPort } from '@/application/driver-ports/ListProjectsDriverPort';

// ========================================
// Application クラス
// ========================================

/**
 * Application クラスは Driver Port のコンテナ
 * Bootstrap 層から UseCase 実装を注入される
 */
export class Application {
  constructor(
    public readonly createProject: CreateProjectDriverPort,
    public readonly archiveProject: ArchiveProjectDriverPort,
    public readonly listProjects: ListProjectsDriverPort
  ) {}
}
```

### Driven Port実装（Infrastructure層）

```typescript
// infrastructure/firestore/adapters/FirestoreProjectRepository.ts

import { ProjectRepository } from '@/application/driven-ports/ProjectRepository';
import { Project, ProjectSummary } from '@/domain/Project/entities';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { ProjectDocSchema } from '../schemas/ProjectDocSchema';

// ========================================
// Driven Port実装（Adapter）
// ========================================

export class FirestoreProjectRepository implements ProjectRepository {
  private readonly collectionPath = 'projects';

  async findById(id: string): Promise<Project | null> {
    const docRef = doc(firestore, this.collectionPath, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return ProjectDocSchema.parse(data) as Project;
  }

  async findByUserId(userId: string): Promise<ProjectSummary[]> {
    const q = query(
      collection(firestore, this.collectionPath),
      where('ownerId', '==', userId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc =>
      ProjectDocSchema.parse(doc.data()) as ProjectSummary
    );
  }

  async list(options?: { limit?: number; offset?: number }): Promise<ProjectSummary[]> {
    const snapshot = await getDocs(collection(firestore, this.collectionPath));
    return snapshot.docs.map(doc =>
      ProjectDocSchema.parse(doc.data()) as ProjectSummary
    );
  }

  async search(query: string): Promise<ProjectSummary[]> {
    // 実装例（簡略版）
    const snapshot = await getDocs(collection(firestore, this.collectionPath));
    return snapshot.docs
      .map(doc => ProjectDocSchema.parse(doc.data()) as ProjectSummary)
      .filter(p => p.name.includes(query));
  }

  async save(project: Project): Promise<void> {
    const docRef = doc(firestore, this.collectionPath, project.id);
    await setDoc(docRef, project);
  }
}
```

### 使用例（Presentation層のContainer Hook）

```typescript
// presentation/containers/hooks/useProjectListContainer.tsx

import { useApplication } from '@/bootstrap/ApplicationContext';
import { useEffect, useState } from 'react';
import { ProjectSummary } from '@/domain/Project/entities';

// ========================================
// Container Hook
// ========================================

export function useProjectListContainer() {
  const app = useApplication(); // Bootstrap層から注入されたApplicationを取得
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    app.listProjects.execute()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [app]);

  const archiveProject = async (projectId: string) => {
    await app.archiveProject.execute(projectId, 'current-user-id');
    // リフレッシュ
    const updated = await app.listProjects.execute();
    setProjects(updated);
  };

  return { projects, loading, archiveProject };
}
```

## 6.3. ルール1: Driver Port は Application 層で定義する

* **説明:** Driver Port（入力ポート）は **Application 層の `driver-ports/` フォルダ** に配置します。Driver Port は、Presentation 層などの外部から Application 層への入力インターフェースを定義します。各 UseCase に対応する Driver Port を作成します。
* **意図:**
  * 外部（Presentation 層）が Application 層に「何を要求できるか」を明確に定義
  * UseCase の公開インターフェースを標準化
  * テスト時に UseCase をモック化しやすくする
  * ヘキサゴナルアーキテクチャの「Port」を明示的に表現
* **該当サンプル:**

```typescript
// application/driver-ports/CreateProjectDriverPort.ts

export interface CreateProjectDriverPort {
  execute(input: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Project>;
}
```

```typescript
// application/driver-ports/ArchiveProjectDriverPort.ts

export interface ArchiveProjectDriverPort {
  execute(projectId: string, archivedBy: string): Promise<void>;
}
```

### チェックリスト

* ✅ Driver Port インターフェースは `application/driver-ports/` に配置されているか?
* ✅ Driver Port は `execute()` メソッドを持つインターフェースとして定義されているか?
* ✅ Driver Port の命名は `{UseCase}DriverPort` の形式になっているか?

### アンチパターン

* ❌ Driver Port を Domain 層に配置する（Application 層に配置すべき）
* ❌ Driver Port を具象クラスで定義する（インターフェースであるべき）

## 6.4. ルール2: Driven Port は Application 層で定義する

* **説明:** Driven Port（出力ポート）は **Application 層の `driven-ports/` フォルダ** に配置します。Driven Port は、Application 層が外部システム（データベース、外部API、時刻、ID生成など）に対して「何を要求するか」を定義します。Repository、外部サービス、時刻、ID生成などの抽象インターフェースがここに含まれます。
* **Repository パターン:**
  * **Query メソッド**: 複数（用途別）
    * 例: `findById()`, `findByUserId()`, `list()`, `search()`
  * **Save メソッド**: 1つ
    * `save(entity)` のみ（作成・更新を統一）
* **意図:**
  * Application 層が依存する外部リソースを明示的に定義
  * Domain 層を完全に純粋に保つ（外部依存なし）
  * Infrastructure 層はこれらの Driven Port を実装する（Adapter パターン）
  * テスト時の Mock 差し替えが容易
* **該当サンプル:**

```typescript
// application/driven-ports/ProjectRepository.ts

export interface ProjectRepository {
  // Query メソッド（複数）
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<ProjectSummary[]>;
  list(options?: { limit?: number; offset?: number }): Promise<ProjectSummary[]>;
  search(query: string): Promise<ProjectSummary[]>;

  // Save メソッド（1つ）
  save(project: Project): Promise<void>;
}
```

```typescript
// application/driven-ports/ClockPort.ts

export interface ClockPort {
  now(): Date;
}
```

```typescript
// application/driven-ports/IdPort.ts

export interface IdPort {
  uuid(): string;
}
```

### チェックリスト

* ✅ Driven Port インターフェースは `application/driven-ports/` に配置されているか?
* ✅ Repository には複数の Query メソッドと1つの Save メソッドがあるか?
* ✅ Driven Port は Domain の型のみを参照しているか（Infrastructure の型を参照していないか）?

### アンチパターン

* ❌ Repository に `create()` と `update()` を別々に定義する（`save()` に統一すべき）
* ❌ Driven Port が Infrastructure 層の具体的な実装に依存する（抽象インターフェースであるべき）
* ❌ Driven Port を Infrastructure 層に配置する（Application 層に配置すべき）

## 6.5. ルール3: UseCase は Application 層で実装する

* **説明:** UseCase は **Application 層の `usecases/` フォルダ** に配置します。UseCase は Driver Port インターフェースを実装し、Driven Port を使ってビジネスワークフローを実現します。UseCase は Domain の純粋関数（Command/Query）を組み合わせ、Repository を使って永続化を行います。
* **意図:**
  * UseCase を Application 層で実装することで、Domain 層を純粋に保つ
  * Driver Port の実装として UseCase を提供
  * Driven Port を使って外部システムとやり取り
  * Repository → Domain Command/Query → Repository の流れを実装
* **該当サンプル:**

```typescript
// application/usecases/ArchiveProjectUseCase.ts

export class ArchiveProjectUseCase implements ArchiveProjectDriverPort {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly clock: ClockPort
  ) {}

  async execute(projectId: string, archivedBy: string): Promise<void> {
    // 1. Repository から Entity を取得
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    // 2. Domain Command を実行（純粋関数）
    const { nextState } = archiveProject(project, {
      archivedBy,
      archivedAt: this.clock.now(),
    });

    // 3. Repository に保存
    await this.projectRepo.save(nextState);
  }
}
```

### チェックリスト

* ✅ UseCase は `application/usecases/` に配置されているか?
* ✅ UseCase は Driver Port インターフェースを実装しているか?
* ✅ UseCase は Driven Port をコンストラクタで受け取っているか?
* ✅ UseCase は Repository → Domain Command → Repository の流れを実装しているか?

### アンチパターン

* ❌ UseCase を Domain 層に配置する（Application 層に配置すべき）
* ❌ UseCase が Infrastructure 層の具体実装に依存する（Driven Port を経由すべき）
* ❌ UseCase がビジネスロジックを直接実装する（Domain の純粋関数に委譲すべき）

## 6.6. ルール4: Application 層は依存性注入を受け取るだけ

* **説明:** Application 層は以下を定義します：
  * **Driver Port インターフェース**: 外部からの入力インターフェース
  * **Driven Port インターフェース**: 外部への出力インターフェース（Repository、外部サービス、時刻、ID生成など）
  * **UseCase**: Driver Port の実装（Driven Port を使ってワークフローを実現）
  * **Application クラス**: Driver Port のコンテナ
* **依存性の受け取り:** Application 層は、**依存性（Repository、Port など）をコンストラクタで受け取る** だけです。依存性の解決（DI Container）は **Bootstrap 層** に委譲します。
* **意図:**
  * Application 層を純粋に保つ（環境依存の設定やシングルトン管理を持ち込まない）
  * テスト時にモックを簡単に注入できる
  * 責務を明確に分離する
* **該当サンプル:**

```typescript
// application/index.ts

/**
 * Application クラスは Driver Port のコンテナ
 * Bootstrap 層から UseCase 実装を注入される
 */
export class Application {
  constructor(
    public readonly createProject: CreateProjectDriverPort,
    public readonly archiveProject: ArchiveProjectDriverPort,
    public readonly listProjects: ListProjectsDriverPort
  ) {}
}
```

```typescript
// application/usecases/ArchiveProjectUseCase.ts

export class ArchiveProjectUseCase implements ArchiveProjectDriverPort {
  // 依存性をコンストラクタで受け取るだけ
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly clock: ClockPort
  ) {}
}
```

### チェックリスト

* ✅ Application クラスは Driver Port をコンストラクタで受け取っているか?
* ✅ UseCase は Driven Port をコンストラクタで受け取っているか?
* ✅ Application 層で環境変数や DI Container に直接アクセスしていないか?

### アンチパターン

* ❌ Application 層で環境変数を直接読み込む（`process.env.*`）
* ❌ Application 層で DI Container を持つ（Bootstrap 層に委譲すべき）
* ❌ Application 層でシングルトンパターンを使う（依存性注入すべき）

## 6.7. ルール5: 循環依存を禁止し、境界を越えない

* **説明:** `presentation → bootstrap → application → domain`、`infrastructure → application → domain` の **一方向** を遵守します。Application 層から Infrastructure を **import しない**（Adapter の型参照も NG、型は Driven Port で閉じる）。
* **意図:** 依存グラフを単純に保ち、ビルドと実行の安定性を確保するためです。
* **該当サンプル:**

```typescript
// application/usecases/ArchiveProjectUseCase.ts

// ✅ 正しい依存方向
import { ArchiveProjectDriverPort } from '@/application/driver-ports/ArchiveProjectDriverPort'; // 同じ層（OK）
import { ProjectRepository } from '@/application/driven-ports/ProjectRepository'; // 同じ層（OK）
import { archiveProject } from '@/domain/Project/commands'; // Domain層（OK）

// ❌ 禁止される依存
// import { FirestoreProjectRepository } from '@/infrastructure/firestore/adapters/FirestoreProjectRepository'; // Infrastructure層（NG）
// import { SomeComponent } from '@/presentation/components/SomeComponent'; // Presentation層（NG）
```

### チェックリスト

* ✅ Application 層が Infrastructure 層を import していないか?
* ✅ Application 層が Presentation 層の実装を import していないか?
* ✅ 依存の方向が `presentation → bootstrap → application → domain` になっているか?

### アンチパターン

* ❌ Application 層が Infrastructure 層の具体実装を import する
* ❌ Application 層が Presentation 層のコンポーネントを import する
* ❌ 循環依存が発生している（例: `application → domain → application`）

## 6.8. ルール6: Driver Port と UseCase は1対1の関係

* **説明:** 各 UseCase に対して、対応する Driver Port インターフェースを作成します。Driver Port と UseCase は **1対1の関係** を持ちます。
* **意図:**
  * UseCase の責務を明確にする
  * インターフェースと実装の対応を分かりやすくする
  * テスト時に個別の UseCase をモック化しやすくする
* **該当サンプル:**

```typescript
// application/driver-ports/ArchiveProjectDriverPort.ts - インターフェース

export interface ArchiveProjectDriverPort {
  execute(projectId: string, archivedBy: string): Promise<void>;
}
```

```typescript
// application/usecases/ArchiveProjectUseCase.ts - 実装

export class ArchiveProjectUseCase implements ArchiveProjectDriverPort {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly clock: ClockPort
  ) {}

  async execute(projectId: string, archivedBy: string): Promise<void> {
    // 実装
  }
}
```

### チェックリスト

* ✅ 各 UseCase に対応する Driver Port インターフェースが存在するか?
* ✅ UseCase クラスが Driver Port インターフェースを実装しているか?
* ✅ Driver Port と UseCase の命名が一致しているか（例: `ArchiveProjectDriverPort` と `ArchiveProjectUseCase`）?

### アンチパターン

* ❌ 複数の UseCase が1つの Driver Port を実装する
* ❌ UseCase が Driver Port を実装していない
* ❌ Driver Port と UseCase の命名が不一致
