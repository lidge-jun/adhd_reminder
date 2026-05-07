# UX Model

## Direction

Native reminder-app speed with CLI-JAW density.

Jun selected the 2x2 priority matrix direction on 2026-05-08. The preferred shape is:

- main workspace: priority matrix
- right rail: Today / Focus / Next Actions
- left rail: CLI-JAW modes
- quick capture across the top
- compact checkbox rows with status chips and linked instance chips

## Layout

```text
CLI-JAW Sidebar    Priority Matrix                   Today Rail
Instances          Important + Urgent                selected focus
Board              Important + Not urgent            cutoff note
Todo               Not important + Urgent            next 3 actions
Notes              Not important + Not urgent        waiting/later/done folds
```

## ADHD Rules

- The app should always answer: "What is the next thing?"
- The matrix should make triage visible without becoming a second Kanban.
- The right rail should show one current focus item.
- Next actions should stay capped at three.
- Waiting and Later are pressure-release valves, not primary work views.
- Cutoff text should prevent scope creep after the current item.

## Apple Reminders-Inspired, Not Apple-Copied

- Use the mental model: sidebar lists + reminder stack + details.
- Do not copy Apple icons, visual assets, or exact UI.
- Keep CLI-JAW control-plane tone: compact, precise, local-first.
