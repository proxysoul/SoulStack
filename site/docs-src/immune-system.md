---
title: The immune system
summary: SoulStack's way of testing a product through its real front doors, with ten immune cells that find, verify and remember bugs.
order: 7
---

# The immune system

Unit tests prove functions behave. The immune system proves the product works: the thing people
install starts, draws its screen, keeps their data, and survives a bad network, on every platform.

## The loop

1. **Sense**: scouts (`dendritic`) look for what is missing; attackers (`tcell-hunter`) try to break
   what exists.
2. **Select**: `negative-selection` tries to disprove every claim. Nothing is a bug until something
   tried to kill it.
3. **Remember**: `memory-cell` turns each confirmed bug into a permanent check that fails before the
   fix and passes after.
4. **Patrol**: `tcell-patrol` runs every check on every release and sorts each failure.

`tcell-helper` coordinates the others. See [immune cells](immune-cells.md) for all ten.

## Grown for each project

An immune system is built by an agent for one project, like `EMPRYO.md`. The cells SoulStack
installs are **stem cells**: they know the method, and on their first run in a project they grow
into that project's cells, with its real commands, platforms, front doors and traps. A grown copy
lives in the project (`.agents/agents/` for Empryo, `.claude/agents/` for Claude Code) and wins over
the global one.

Ask your agent to "grow an immune system for this project". The `immune-system` skill guides it:
study the product, scaffold `immune/`, write the first checks, wire the commands, grow the cells,
and prove it catches a known bug. It goes further in Empryo: see [best with Empryo](with-empryo.md).

The skill's full text is in [skills/immune-system](skills/immune-system.md).
