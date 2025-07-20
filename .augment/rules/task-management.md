---
type: "agent_requested"
description: "Task Management Rules"
---

# Task Management Rules

## Moon Build System

This project uses [Moon](https://moonrepo.dev) as the primary task runner and build orchestrator:

- **Global tasks** defined in `.moon/tasks.yml` apply to all packages
- **Project-specific tasks** defined in individual `moon.yml` files
- **Workspace configuration** in `.moon/workspace.yml` defines project discovery

## Caching Strategy

### Cache-Friendly Tasks

- **Build tasks**: Cache for 24 hours with source file inputs
- **Test tasks**: Cache for 1 hour with test and source inputs
- **Lint tasks**: Cache for 6 hours with source file inputs
- **Format tasks**: Cache for 12 hours with source file inputs

### Cache-Disabled Tasks

- **CI tasks**: Always run fresh in CI environments
- **Version tasks**: Never cache version bumping
- **Publish tasks**: Never cache publishing operations

## Task Configuration Best Practices

- Use appropriate cache lifetimes based on task frequency
- Define clear input/output patterns for reliable caching
- Set `runInCI: false` for tasks that shouldn't run in CI
- Use `allowFailure: true` for optional tasks
- Leverage `runDepsInParallel: true` for independent dependencies
