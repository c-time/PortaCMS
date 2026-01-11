---
name: hexagonal-coding
description: Coding guidance for hexagonal architecture projects following strict layered design patterns (Domain/Application/Infrastructure/Presentation/Bootstrap). Use when implementing features, refactoring code, or fixing bugs in hexagonal architecture codebases. Includes Plan Mode for task decomposition and Execution Mode for layer-specific implementation.
---

# Hexagonal Architecture Coding

## Overview

Guide Claude through implementing features in hexagonal architecture projects using two distinct modes:

1. **Plan Mode**: Decompose tasks to ensure each subtask modifies only ONE layer
2. **Execution Mode**: Implement subtasks with layer-specific documentation loaded

## Core Principles

**Separation of Concerns**: Each layer has distinct responsibilities
- **Domain**: Pure business logic (entities, commands, queries)
- **Application**: Use cases and port definitions (driver-ports, driven-ports)
- **Infrastructure**: External system adapters (repositories, HTTP clients)
- **Presentation**: UI components and facades
- **Bootstrap**: Dependency injection only

**Dependency Direction**: Strictly one-way
```
Presentation → Bootstrap → Application → Domain
Infrastructure → Application → Domain
```

**Critical Rules**:
- Application NEVER imports Infrastructure
- Domain NEVER imports any other layer
- Infrastructure NEVER imports Presentation

## Workflow Decision Tree

```
User Request
    │
    ├─ Is this a new feature or multi-layer change?
    │   └─ YES → Enter Plan Mode
    │       └─ Decompose into single-layer tasks
    │           └─ For each task → Enter Execution Mode
    │
    └─ NO → Is it a single-layer bug fix or small change?
        └─ YES → Enter Execution Mode directly
            └─ Load appropriate layer documentation
```

## Plan Mode

**When to use**: Multi-layer features, refactoring, or architectural changes

**Goal**: Break down work so each task touches ONE layer only

### Task Decomposition Guidelines

1. **Identify affected layers** - Which layers need changes?
2. **Order by dependency** - Start with Domain, then Application, then Infrastructure/Presentation
3. **One task per layer** - Never mix layers in a single task

**Example breakdown** for "Add user profile archiving":

✅ **Good decomposition**:
- Task 1 (Domain): Add `archiveUser` command to `User` aggregate
- Task 2 (Application): Create `ArchiveUserUseCase` and `ArchiveUserDriverPort`
- Task 3 (Infrastructure): Update `FirestoreUserRepository.save()` to handle archived status
- Task 4 (Presentation): Add "Archive" button to user profile page

❌ **Bad decomposition**:
- Task 1: Implement user archiving (touches all layers - too broad)

### Deliverable

Output a numbered task list:
```markdown
## Implementation Tasks

1. **Domain Layer**: Add archiveUser command
   - File: domain/User/commands.ts
   - Changes: Add archiveUser function and types

2. **Application Layer**: Create ArchiveUserUseCase
   - Files: application/usecases/ArchiveUserUseCase.ts, application/driver-ports/ArchiveUserDriverPort.ts
   - Changes: Define port and implement use case

...
```

## Execution Mode

**When to use**: Implementing a single task from Plan Mode, or a simple single-layer fix

**Goal**: Follow layer-specific rules with appropriate documentation loaded

### Execution Process

1. **Identify the layer** from task description
2. **Load layer documentation**:
   - Domain: Read [references/domain-layer.md](references/domain-layer.md)
   - Application: Read [references/application-layer.md](references/application-layer.md)
   - Infrastructure: Read [references/infrastructure-layer.md](references/infrastructure-layer.md)
   - Presentation: Read [references/presentation-layer.md](references/presentation-layer.md)
   - Bootstrap: Read [references/bootstrap-layer.md](references/bootstrap-layer.md)
   - Project structure: Read [references/project-structure.md](references/project-structure.md)
3. **Follow layer-specific rules** documented in the loaded file
4. **Implement the changes** according to the rules

### Layer-Specific Quick Reference

**Domain Layer** ([domain-layer.md](references/domain-layer.md)):
- Files: `domain/{Aggregate}/entities.ts`, `commands.ts`, `queries.ts`
- Rules: Pure functions, no external dependencies, immutable entities
- Patterns: Commands return `{ nextState, patch }`, Queries are read-only

**Application Layer** ([application-layer.md](references/application-layer.md)):
- Files: `application/usecases/`, `driver-ports/`, `driven-ports/`
- Rules: Driver Port per UseCase (1:1), Repository has multiple queries + 1 save
- Patterns: UseCase implements Driver Port, errors defined with ports

**Infrastructure Layer** ([infrastructure-layer.md](references/infrastructure-layer.md)):
- Files: `infrastructure/{datastore}/adapters/`, `schemas/`
- Rules: Implement driven ports, map external ↔ domain types, no business logic
- Patterns: Timeout/retry for I/O, schema validation with zod

**Presentation Layer** ([presentation-layer.md](references/presentation-layer.md)):
- Files: `presentation/compoundComponents/`, `facades/`, `{Page}.tsx`
- Rules: Facade interfaces defined here, pages have no props, max 1 level nesting
- Patterns: Compound components with adapter.ts + model.ts + index.tsx

**Bootstrap Layer** ([bootstrap-layer.md](references/bootstrap-layer.md)):
- Files: `bootstrap/DIContainer.ts`
- Rules: DI only, env vars read here only, creates Application instance
- Patterns: Singleton repositories, factory methods for use cases

## Validation Checklist

Before completing a task, verify:

**Dependency Direction**:
- [ ] No circular dependencies
- [ ] Application doesn't import Infrastructure
- [ ] Domain doesn't import any other layer

**File Organization**:
- [ ] Files in correct layer directory
- [ ] Naming follows conventions (e.g., `{Name}UseCase.ts`, `{Name}Command.ts`)

**Layer-Specific Rules**:
- [ ] Domain: Pure functions, no I/O
- [ ] Application: Driver/Driven ports properly defined
- [ ] Infrastructure: External types converted to Domain types
- [ ] Presentation: Facade interfaces, no direct Application imports
- [ ] Bootstrap: Only DI logic

## Common Mistakes to Avoid

**❌ Mixing layers in one task**
```
Task: Add user archiving feature
Problem: Changes Domain, Application, Infrastructure in one go
Solution: Break into 3 separate tasks
```

**❌ Wrong dependency direction**
```typescript
// application/usecases/ArchiveUserUseCase.ts
import { FirestoreUserRepository } from '@/infrastructure/...'; // ❌ NO!
```

**❌ Business logic in Infrastructure**
```typescript
// infrastructure/adapters/FirestoreUserRepository.ts
async save(user: User): Promise<void> {
  if (user.status === 'active') { // ❌ NO! This is business logic
    // ...
  }
}
```

**❌ Domain depending on external tech**
```typescript
// domain/User/entities.ts
import { Timestamp } from 'firebase/firestore'; // ❌ NO! Domain must be pure
```

## Resources

### references/

Detailed layer-specific documentation:

- **[project-structure.md](references/project-structure.md)** - Directory structure and file naming conventions
- **[domain-layer.md](references/domain-layer.md)** - Domain layer rules (entities, commands, queries)
- **[application-layer.md](references/application-layer.md)** - Application layer rules (use cases, ports)
- **[infrastructure-layer.md](references/infrastructure-layer.md)** - Infrastructure layer rules (adapters, schemas)
- **[presentation-layer.md](references/presentation-layer.md)** - Presentation layer rules (components, facades)
- **[bootstrap-layer.md](references/bootstrap-layer.md)** - Bootstrap layer rules (DI container)

**When to read**:
- In Plan Mode: Read project-structure.md for overview
- In Execution Mode: Read specific layer documentation before implementing
