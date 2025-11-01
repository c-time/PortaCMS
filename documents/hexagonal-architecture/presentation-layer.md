---
title: Presentation層：Compound Component パターンによるUI設計
---

# 3. Presentation層：Compound Component パターンによるUI設計

> **Presentation 層は UI とユーザーインタラクションを担当します。** Facade インターフェースを定義し、Compound Component パターンで状態管理と表示を分離します。

## 3.0. Presentation層の構造概要

### フォルダ構造

```
presentation/
├── facades/                      # Facadeインターフェース（Application層への要求定義）
│   ├── ProjectFacade.ts
│   └── UserFacade.ts
│
├── App.tsx                       # Application Component（ApplicationContextに依存）
├── ErrorBoundary.tsx             # エラーハンドリング
├── Router.tsx                    # ルーティング
│
├── ProjectListPage.tsx           # ページコンポーネント（ルート直下）
├── ProjectDetailPage.tsx
├── SitemapEditorPage.tsx
│
└── compoundComponents/           # Compound Components
    ├── ProjectCard/
    │   ├── index.tsx             # ProjectCard（状態管理 + 子供への受け渡し）
    │   ├── adapter.ts            # Application Adapter（hooks）
    │   ├── model.ts              # View Model
    │   ├── ProjectCardHeader.tsx # Child Component
    │   ├── ProjectCardBody.tsx   # Child Component
    │   └── ProjectCardFooter.tsx # Child Component
    │
    └── SitemapTree/
        ├── index.tsx
        ├── adapter.ts
        ├── model.ts
        ├── SitemapTreeNode.tsx
        └── SitemapTreeActions.tsx
```

## 3.1. ルール1: Facade インターフェースは Presentation 層で定義する

* **説明:** Presentation 層は、Application 層に対して「何を必要としているか」を **Facade インターフェース** として定義します。実装は Application 層が提供し、Bootstrap 層が注入します。
* **意図:**
  * 依存性逆転の原則（DIP）に従う
  * Presentation 層が Application 層の実装詳細を知らない
  * Presentation 層の要求を明確に定義
  * テスト時にモック実装を簡単に差し替え可能
* **配置:** `presentation/facades/`

```typescript
// presentation/facades/ProjectFacade.ts
import { Project, ProjectSummary } from '@/domain/Project/entities';

/**
 * ProjectFacade インターフェース
 * Presentation 層が Application 層に要求する機能を定義
 * 実装は Application 層が提供し、Bootstrap 層が注入
 */
export interface ProjectFacade {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<Project | null>;
  createProject(input: { name: string; description: string; ownerId: string }): Promise<Project>;
  archiveProject(projectId: string, archivedBy: string): Promise<void>;
  renameProject(projectId: string, newName: string): Promise<void>;
}
```

## 3.2. ルール2: Application Component はルート直下に配置

* **説明:** `App.tsx`, `ErrorBoundary.tsx`, `Router.tsx` などのアプリケーション全体に関わるコンポーネントは **ルート直下** に配置します。これらは `ApplicationContext` に依存します。
* **意図:**
  * アプリケーションのエントリーポイントを明確にする
  * グローバルな設定やプロバイダーを一箇所に集約
* **配置:** `presentation/App.tsx`, `presentation/ErrorBoundary.tsx` など

```typescript
// presentation/App.tsx
import { useApplication } from '@/bootstrap/ApplicationContext';
import { Router } from './Router';
import { ErrorBoundary } from './ErrorBoundary';

export function App() {
  const app = useApplication(); // Bootstrap層から注入されたApplicationを取得

  return (
    <ErrorBoundary>
      <Router app={app} />
    </ErrorBoundary>
  );
}
```

## 3.3. ルール3: ページコンポーネントはルート直下に配置

* **説明:** `XXXPage.tsx` 形式のページコンポーネントは **ルート直下** に一覧として配置します。ページは Compound Components を組み合わせて構成します。**ページコンポーネントは Props を持ちません。**
* **意図:**
  * ページの全体像を把握しやすくする
  * ページ間の関係性を明確にする
  * フォルダ階層を深くしない
  * Router から直接呼び出される独立したエントリーポイントとして設計
* **配置:** `presentation/ProjectListPage.tsx`, `presentation/ProjectDetailPage.tsx` など

```typescript
// presentation/ProjectListPage.tsx
import { ProjectCard } from './compoundComponents/ProjectCard';
import { useProjectListAdapter } from './compoundComponents/ProjectList/adapter';

/**
 * ProjectListPage
 * Propsなし、内部でAdapterを使用してデータを取得
 */
export function ProjectListPage() {
  const { projects, loading } = useProjectListAdapter();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Projects</h1>
      {projects.map(project => (
        <ProjectCard key={project.id} projectId={project.id} />
      ))}
    </div>
  );
}
```

## 3.4. ルール4: Compound Component パターンで状態管理と表示を分離

* **説明:** Compound Component は、**状態管理** と **子コンポーネントへの受け渡し** を担当します。以下のファイル構成を持ちます：
  * **`index.tsx`**: メインコンポーネント（状態管理 + 子供への受け渡し）
  * **`adapter.ts`**: Application Adapter（hooks、状態操作）
  * **`model.ts`**: View Model（型定義）
  * **Child Components**: 表示専用コンポーネント
* **意図:**
  * 状態管理と表示を分離
  * 再利用性の向上
  * テスト容易性の向上
* **配置:** `presentation/compoundComponents/{ComponentName}/`

### 4-1. View Model (`model.ts`)

View Model は、Compound Component が扱うデータの型を定義します。

```typescript
// presentation/compoundComponents/ProjectCard/model.ts
import { ProjectSummary } from '@/domain/Project/entities';

/**
 * ProjectCard の View Model
 */
export interface ProjectCardViewModel {
  project: ProjectSummary;
  isArchiving: boolean;
}

/**
 * ProjectCard の操作
 */
export interface ProjectCardActions {
  onArchive: () => Promise<void>;
  onEdit: () => void;
}
```

### 4-2. Application Adapter (`adapter.ts`)

Application Adapter は、Facade を使ってデータを取得し、状態を管理する hooks を提供します。

```typescript
// presentation/compoundComponents/ProjectCard/adapter.ts
import { useApplication } from '@/bootstrap/ApplicationContext';
import { useState, useEffect } from 'react';
import { ProjectCardViewModel, ProjectCardActions } from './model';
import { ProjectSummary } from '@/domain/Project/entities';

/**
 * ProjectCard の Application Adapter
 * Facade を使ってデータを取得し、状態を管理
 */
export function useProjectCardAdapter(projectId: string): {
  viewModel: ProjectCardViewModel | null;
  actions: ProjectCardActions;
} {
  const app = useApplication();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    app.projectFacade.getProject(projectId)
      .then(p => p && setProject(p as ProjectSummary));
  }, [app, projectId]);

  const onArchive = async () => {
    setIsArchiving(true);
    try {
      await app.projectFacade.archiveProject(projectId, 'current-user-id');
      const updated = await app.projectFacade.getProject(projectId);
      if (updated) setProject(updated as ProjectSummary);
    } finally {
      setIsArchiving(false);
    }
  };

  const onEdit = () => {
    // ナビゲーション処理など
  };

  if (!project) {
    return {
      viewModel: null,
      actions: { onArchive: async () => {}, onEdit: () => {} }
    };
  }

  return {
    viewModel: { project, isArchiving },
    actions: { onArchive, onEdit }
  };
}
```

### 4-3. メインコンポーネント (`index.tsx`)

メインコンポーネントは、Adapter を使って状態を取得し、子コンポーネントに受け渡します。

```typescript
// presentation/compoundComponents/ProjectCard/index.tsx
import { useProjectCardAdapter } from './adapter';
import { ProjectCardHeader } from './ProjectCardHeader';
import { ProjectCardBody } from './ProjectCardBody';
import { ProjectCardFooter } from './ProjectCardFooter';

interface ProjectCardProps {
  projectId: string;
}

/**
 * ProjectCard Compound Component
 * 状態管理と子コンポーネントへの受け渡しを担当
 */
export function ProjectCard({ projectId }: ProjectCardProps) {
  const { viewModel, actions } = useProjectCardAdapter(projectId);

  if (!viewModel) return null;

  return (
    <div className="project-card">
      <ProjectCardHeader
        name={viewModel.project.name}
        status={viewModel.project.status}
      />
      <ProjectCardBody />
      <ProjectCardFooter
        onArchive={actions.onArchive}
        onEdit={actions.onEdit}
        isArchiving={viewModel.isArchiving}
      />
    </div>
  );
}
```

### 4-4. Child Components（表示専用）

Child Components は、受け取った props を表示するだけの純粋なコンポーネントです。

```typescript
// presentation/compoundComponents/ProjectCard/ProjectCardHeader.tsx
interface ProjectCardHeaderProps {
  name: string;
  status: 'active' | 'archived';
}

/**
 * ProjectCard Header（表示専用）
 */
export function ProjectCardHeader({ name, status }: ProjectCardHeaderProps) {
  return (
    <div className="project-card-header">
      <h3>{name}</h3>
      <span className={`status ${status}`}>{status}</span>
    </div>
  );
}
```

```typescript
// presentation/compoundComponents/ProjectCard/ProjectCardFooter.tsx
interface ProjectCardFooterProps {
  onArchive: () => void;
  onEdit: () => void;
  isArchiving: boolean;
}

/**
 * ProjectCard Footer（表示専用）
 */
export function ProjectCardFooter({ onArchive, onEdit, isArchiving }: ProjectCardFooterProps) {
  return (
    <div className="project-card-footer">
      <button onClick={onEdit}>Edit</button>
      <button onClick={onArchive} disabled={isArchiving}>
        {isArchiving ? 'Archiving...' : 'Archive'}
      </button>
    </div>
  );
}
```

## 3.5. ルール5: Child Component のネストは1階層まで

* **説明:** Compound Component の構造は以下のみ許可します：
  * ✅ **OK**: `Compound Component → Child Component`
  * ❌ **NG**: `Compound Component → Child Component → Child Component`
* **意図:**
  * コンポーネントツリーをフラットに保つ
  * 状態の受け渡しを単純化
  * 再利用性を損なわない
* **アンチパターン:**

```typescript
// ❌ NG: Child Component の中に Child Component
<ProjectCard>
  <ProjectCardBody>
    <ProjectCardBodyContent>  {/* ← これはNG */}
      <ProjectCardBodyText /> {/* ← さらにネストはNG */}
    </ProjectCardBodyContent>
  </ProjectCardBody>
</ProjectCard>

// ✅ OK: Compound Component → Child Component のみ
<ProjectCard>
  <ProjectCardHeader />
  <ProjectCardBody />
  <ProjectCardFooter />
</ProjectCard>
```

## チェックリスト

1. ✅ Facade インターフェースは `presentation/facades/` に配置されているか？
2. ✅ Application Component は `presentation/` ルート直下に配置されているか？
3. ✅ ページコンポーネントは `presentation/XXXPage.tsx` 形式でルート直下に配置されているか？
4. ✅ ページコンポーネントは Props を持っていないか？
5. ✅ Compound Component は `presentation/compoundComponents/{ComponentName}/` に配置されているか？
6. ✅ 各 Compound Component に `index.tsx`, `adapter.ts`, `model.ts` があるか？
7. ✅ Child Component は表示専用（状態管理なし）か？
8. ✅ Child Component のネストは1階層までか？
9. ✅ Adapter は Facade 経由でデータを取得しているか？

## アンチパターン

* ❌ ページコンポーネントを `pages/` フォルダに入れる（ルート直下に配置すべき）
* ❌ ページコンポーネントが Props を持つ（内部で Adapter を使うべき）
* ❌ Compound Component に状態管理を直接書く（adapter.ts に分離すべき）
* ❌ Child Component が hooks を使う（表示専用にすべき）
* ❌ Child Component を2階層以上ネストする（1階層までにすべき）
* ❌ Adapter が Facade を使わず直接 UseCase を呼ぶ（Facade 経由にすべき）
* ❌ View Model を定義せず any や unknown を使う（model.ts で型定義すべき）
