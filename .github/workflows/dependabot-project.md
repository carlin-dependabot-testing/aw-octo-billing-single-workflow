---
on: weekly
permissions:
  contents: read
  issues: read
  pull-requests: read
tools:
  github:
    toolsets: [default, projects]
safe-outputs:
  create-issue:
    title-prefix: '[dependabot-project] '
    max: 10
  update-project:
    project: "https://github.com/orgs/carlin-dependabot-testing/projects/1"
    max: 50
  create-project-status-update:
    project: "https://github.com/orgs/carlin-dependabot-testing/projects/1"
    max: 1
---
# Dependabot Burner (with Projects)

- Add all open Dependabot PRs to the project board under “Todo”.
- Create bundle issues grouped by runtime + manifest (max 5 PRs each, security separate, no duplicates).
- Explain the grouping briefly and list PRs in merge order (patch/minor → major).
- Add bundle issues to the project board under “Review Required”. 
- Post a status update with PR counts: open, merged/closed since last update, remaining.