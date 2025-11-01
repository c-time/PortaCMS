---
title: Application層：UseCase と Facade の境界
---

# 6. Application層：UseCase と Facade の境界

> **Application は Presentation 層のための"窓口（Facade）"。** UseCase の組み立てとFacadeの提供だけを担い、ビジネス判断やI/Oの詳細は持ち込みません。依存性注入（DI）は Bootstrap 層に委譲し、Application 層は純粋に保ちます。

## 6.1. ルール1: Facade 実装は Application 層で定義する

* **説明:** Facade の**インターフェース**は **Presentation 層** に配置し、**実装**は **Application 層** に配置します。Facade は UseCase を組み合わせた高レベルAPIを提供し、Presentation 層が UseCase や Repository に直接触れることを防ぎます。
* **意図:**
  * Presentation 層が「何を必要としているか」を明確に定義
  * Application 層が Presentation 層の要求を実装
  * Bootstrap 層が実装を注入（依存性逆転の原則）
  * テスト時の差し替えを容易にする
* **フォルダ構造:**

```
presentation/
└── facades/                      # Facadeインターフェース（Presentation層が定義）
    ├── ProjectFacade.ts
    └── UserFacade.ts

application/
├── ports/                        # Portインターフェース（Repository等）
│   ├── ProjectRepository.ts
│   ├── UserRepository.ts
│   ├── ClockPort.ts
│   └── IdPort.ts
├── facades/                      # Facade実装（Application層が実装）
│   ├── ProjectFacadeImpl.ts
│   └── UserFacadeImpl.ts
└── index.ts                      # Application クラス

bootstrap/
└── DIContainer.ts                # Facade実装を注入
```

* **サンプル（Facade 実装）**

```typescript
// application/facades/ProjectFacadeImpl.ts
import { ProjectFacade } from '@/presentation/facades/ProjectFacade';
import { Project, ProjectSummary, createProject } from '@/domain/Project/entities';
import { ProjectRepository } from '@/application/ports/ProjectRepository';
import { IdPort } from '@/application/ports/IdPort';
import { ClockPort } from '@/application/ports/ClockPort';
import { ArchiveProjectUseCase } from '@/domain/usecases/ArchiveProjectUseCase';
import { RenameProjectUseCase } from '@/domain/usecases/RenameProjectUseCase';

/**
 * ProjectFacade の実装クラス
 * UseCase を組み合わせて、Presentation 層に提供する
 */
export class ProjectFacadeImpl implements ProjectFacade {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly idPort: IdPort,
    private readonly clockPort: ClockPort
  ) {}

  async listProjects(): Promise<ProjectSummary[]> {
    return this.projectRepo.list();
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.projectRepo.findById(projectId);
  }

  async createProject(input: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Project> {
    const project = createProject({
      id: this.idPort.uuid(),
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
    });
    await this.projectRepo.save(project);
    return project;
  }

  async archiveProject(projectId: string, archivedBy: string): Promise<void> {
    const useCase = new ArchiveProjectUseCase(this.projectRepo, this.clockPort);
    await useCase.execute(projectId, archivedBy);
  }

  async renameProject(projectId: string, newName: string): Promise<void> {
    const useCase = new RenameProjectUseCase(this.projectRepo, this.clockPort);
    await useCase.execute(projectId, newName);
  }
}
```

## 6.2. ルール2: Port インターフェースは Application 層で定義する

* **説明:** Port（インターフェース）は **Application 層** に配置します。Port は、Application 層が Domain 層や Infrastructure 層に対して「何を要求するか」を定義します。Repository、外部サービス、時刻、ID生成などの抽象インターフェースがここに含まれます。
* **Repository パターン:**
  * **Query メソッド**: 複数（用途別）
    * 例: `findById()`, `findByUserId()`, `list()`, `search()`
  * **Save メソッド**: 1つ
    * `save(entity)` のみ（作成・更新を統一）
* **意図:**
  * Application 層が依存する外部リソースを明示的に定義
  * Domain 層を完全に純粋に保つ（外部依存なし）
  * Infrastructure 層はこれらの Port を実装する
  * テスト時の Mock 差し替えが容易
* **サンプル**

```typescript
// application/ports/ProjectRepository.ts
import { Project, ProjectSummary } from '@/domain/Project/entities';

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
// application/ports/ClockPort.ts
export interface ClockPort {
  now(): Date;
}
```

```typescript
// application/ports/IdPort.ts
export interface IdPort {
  uuid(): string;
}
```

## 6.3. ルール3: UseCase は Application 層で定義する

* **説明:** UseCase は **Application 層** の `domain/usecases/` に配置します。UseCase は複数の Aggregate をまたぐワークフローや、Port を使った永続化を含む手続きを定義します。
* **意図:**
  * Aggregate は純粋なビジネスルールに集中
  * UseCase は Port を使って永続化やI/Oを行う
  * Application 層が UseCase を組み合わせて Facade を提供
* **フォルダ構造:**

```
domain/
├── {Aggregate1}/
├── {Aggregate2}/
└── usecases/
    ├── {UseCase1}UseCase.ts
    └── {UseCase2}UseCase.ts
```

* **サンプル**

```typescript
// domain/usecases/ArchiveProjectUseCase.ts
import { ProjectRepository } from '@/application/ports/ProjectRepository';
import { ClockPort } from '@/application/ports/ClockPort';
import { archiveProject } from '../Project/commands';

export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found.');
    this.name = 'ProjectNotFoundError';
  }
}

export class ArchiveProjectUseCase {
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

    // 2. Command を実行（純粋関数）
    const { nextState } = archiveProject(project, {
      archivedBy,
      archivedAt: this.clock.now(),
    });

    // 3. Repository に保存
    await this.projectRepo.save(nextState);
  }
}
```

## 6.4. ルール4: Application 層は依存性注入を受け取るだけ

* **説明:** Application 層は以下を定義します：
  * **Port インターフェース**: Repository、外部サービス、時刻、ID生成などの抽象インターフェース
  * **UseCase**: ビジネスワークフローの実装
  * **Facade**: Presentation 層へのインターフェースと実装
  * **Application クラス**: Facade のコンテナ
* **依存性の受け取り:** Application 層は、**依存性（Repository、Port など）をコンストラクタで受け取る** だけです。依存性の解決（DI Container）は **Bootstrap 層** に委譲します。
* **意図:**
  * Application 層を純粋に保つ（環境依存の設定やシングルトン管理を持ち込まない）
  * テスト時にモックを簡単に注入できる
  * 責務を明確に分離する
* **サンプル（Application のエントリーポイント）**

```typescript
// application/index.ts
import { ProjectFacade } from '@/presentation/facades/ProjectFacade';
import { UserFacade } from '@/presentation/facades/UserFacade';

/**
 * Application クラスは Facade のコンテナ
 * Bootstrap 層から Facade の実装を注入される
 */
export class Application {
  constructor(
    public readonly projectFacade: ProjectFacade,
    public readonly userFacade: UserFacade
  ) {}
}
```

* **使用例（Presentation 層から）**

```typescript
// presentation/containers/hooks/useProjectListContainer.tsx
import { useApplication } from '@/bootstrap/ApplicationContext';
import { useEffect, useState } from 'react';
import { ProjectSummary } from '@/domain/Project/entities';

export function useProjectListContainer() {
  const app = useApplication(); // Bootstrap層から注入されたApplicationを取得
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    app.projectFacade.listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [app]);

  const archiveProject = async (projectId: string) => {
    await app.projectFacade.archiveProject(projectId, 'current-user-id');
    // リフレッシュ
    const updated = await app.projectFacade.listProjects();
    setProjects(updated);
  };

  return { projects, loading, archiveProject };
}
```

## 6.5. ルール5: Facade は複数の UseCase を組み合わせる

* **説明:** Facade は、1つまたは複数の UseCase を組み合わせて、Presentation 層に最適なAPIを提供します。複数の UseCase を順次実行したり、結果を変換したりすることができます。
* **意図:**
  * Presentation 層のロジックを簡潔に保つ
  * UseCase の再利用性を高める
  * ビジネスワークフローを Application 層に集約
* **サンプル**

```typescript
// application/facades/ProjectFacadeImpl.ts（複雑な例）
export class ProjectFacadeImpl implements ProjectFacade {
  // ... 省略 ...

  /**
   * プロジェクトを複製する（複数のUseCaseを組み合わせた例）
   */
  async duplicateProject(
    sourceProjectId: string,
    newName: string,
    ownerId: string
  ): Promise<Project> {
    // 1. 元のプロジェクトを取得
    const sourceProject = await this.projectRepo.findById(sourceProjectId);
    if (!sourceProject) {
      throw new Error('Source project not found');
    }

    // 2. 新しいプロジェクトを作成
    const newProject = createProject({
      id: this.idPort.uuid(),
      name: newName,
      description: `Copy of ${sourceProject.name}`,
      ownerId: ownerId,
    });

    // 3. 保存
    await this.projectRepo.save(newProject);

    return newProject;
  }
}
```

## 6.6. ルール6: 循環依存を禁止し、境界を越えない

* **説明:** `presentation → application → domain`、`infrastructure → domain` の **一方向** を遵守します。Application 層から Presentation/Infrastructure を **import しない**（Adapter の型参照も NG、型は Domain Port で閉じる）。
* **意図:** 依存グラフを単純に保ち、ビルドと実行の安定性を確保するためです。

## 6.7. ルール7: Facade はインターフェースと実装を分離する

* **説明:** Facade は **インターフェース**（`ProjectFacade`）と **実装**（`ProjectFacadeImpl`）を分離します。
  * **インターフェース**: Presentation 層が定義（Presentation 層の要求を明示）
  * **実装**: Application 層が提供（UseCase を組み合わせて実装）
  * **注入**: Bootstrap 層が実装をインターフェースに注入
* **意図:**
  * 依存性逆転の原則（DIP）に従う
  * Presentation 層が Application 層の実装詳細を知らない
  * テスト時にモック実装を簡単に差し替え可能
  * Interface Segregation Principle（インターフェース分離の原則）に従う
* **ファイル配置:**

```
presentation/
└── facades/
    ├── ProjectFacade.ts       # インターフェース（Presentation層が定義）
    └── UserFacade.ts          # インターフェース

application/
└── facades/
    ├── ProjectFacadeImpl.ts   # 実装（Application層が提供）
    └── UserFacadeImpl.ts      # 実装
```

## チェックリスト

1. ✅ Facade インターフェースは Presentation 層で定義されているか？
2. ✅ Facade 実装は Application 層で定義されているか？
3. ✅ Facade 実装は UseCase を組み合わせているか？
4. ✅ Port インターフェースは Application 層で定義されているか？
5. ✅ UseCase は `domain/usecases/` に配置されているか？
6. ✅ Application 層は依存性をコンストラクタで受け取っているか？
7. ✅ Application 層が環境変数や DI Container に直接アクセスしていないか？
8. ✅ 循環依存が発生していないか？

## アンチパターン

* ❌ Presentation 層が UseCase を直接インスタンス化する
* ❌ Facade インターフェースを Application 層に配置する（Presentation 層に配置すべき）
* ❌ Application 層で環境変数を直接読み込む（`process.env.*`）
* ❌ Application 層で DI Container を持つ（Bootstrap 層に委譲すべき）
* ❌ Facade がビジネスロジックを実装する（Domain 層に委譲すべき）
* ❌ Facade が Infrastructure 層に直接依存する（Port を経由すべき）
