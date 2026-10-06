#!/usr/bin/env python3
"""Safely install the portable Heisenberg policy layer into another repository."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


SOURCE_ROOT = Path(__file__).resolve().parents[1]
BASE_FILES = (
    "AGENTS.md",
    ".heisenberg/policy.json",
    ".heisenberg/skills.json",
    ".heisenberg/ui-workflow.json",
    ".heisenberg/schemas/task-manifest.schema.json",
    ".heisenberg/schemas/receipt.schema.json",
    ".heisenberg/templates/task-manifest.json",
    ".heisenberg/templates/web-marketing-ui-task.json",
    ".heisenberg/templates/native-mobile-ui-task.json",
    ".heisenberg/tasks/.gitkeep",
    ".heisenberg/artifacts/.gitkeep",
    ".heisenberg/receipts/.gitkeep",
    "scripts/heisenberg_guard.py",
    "docs/HEISENBERG_UI_WORKFLOW.md",
)
CONTENT_TREES = ("core", "skills", "UItasteskills")
HOST_FILES = {
    "claude": ("CLAUDE.md", ".claude/rules/heisenberg-ui.md", ".claude/skills/heisenberg-ui/SKILL.md"),
    "cursor": (".cursor/rules/00-heisenberg-core.mdc", ".cursor/rules/10-heisenberg-ui.mdc", ".cursor/rules/20-heisenberg-ui-workflow.mdc", ".cursor/hooks.json"),
    "antigravity": (".agents/rules/heisenberg-core.md", ".agents/rules/heisenberg-ui.md", ".agents/skills/heisenberg-ui/SKILL.md", ".agents/hooks.json"),
}


def write_file(source: Path, target: Path, apply: bool, force: bool) -> str:
    relative = target
    if target.exists() and not force:
        return f"SKIP    {relative} (already exists)"
    if not apply:
        return f"CREATE  {relative}"
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and force:
        backup = target.with_suffix(target.suffix + ".heisenberg.bak")
        shutil.copy2(target, backup)
        status = f"BACKUP  {backup}"
    else:
        status = ""
    shutil.copy2(source, target)
    return f"{status}\nWRITE   {relative}".strip()


def content_files() -> tuple[str, ...]:
    files: list[str] = []
    for tree in CONTENT_TREES:
        source_tree = SOURCE_ROOT / tree
        if not source_tree.is_dir():
            raise FileNotFoundError(f"Missing bundled content tree: {tree}")
        files.extend(str(path.relative_to(SOURCE_ROOT)) for path in source_tree.rglob("*") if path.is_file())
    return tuple(files)


def main() -> int:
    parser = argparse.ArgumentParser(description="Install Heisenberg policy files without modifying existing files by default.")
    parser.add_argument("--target", default=".", help="Target repository root.")
    parser.add_argument("--host", choices=("auto", "claude", "cursor", "antigravity", "all"), default="auto")
    parser.add_argument("--apply", action="store_true", help="Write files. Without this flag the command is a dry run.")
    parser.add_argument("--force", action="store_true", help="Back up and replace conflicting Heisenberg-managed files.")
    args = parser.parse_args()

    target_root = Path(args.target).resolve()
    if not target_root.is_dir():
        print(f"Target does not exist: {target_root}", file=sys.stderr)
        return 2
    hosts = [args.host]
    if args.host == "auto":
        hosts = [host for host, marker in (("claude", "CLAUDE.md"), ("cursor", ".cursor"), ("antigravity", ".agents")) if (target_root / marker).exists()]
    elif args.host == "all":
        hosts = list(HOST_FILES)

    files = list(BASE_FILES) + list(content_files())
    for host in hosts:
        files.extend(HOST_FILES[host])
    print(f"Heisenberg initializer: {'APPLY' if args.apply else 'DRY RUN'}\nTarget: {target_root}")
    for relative in dict.fromkeys(files):
        source = SOURCE_ROOT / relative
        if not source.exists():
            print(f"MISSING {relative} in Heisenberg source", file=sys.stderr)
            return 2
        print(write_file(source, target_root / relative, args.apply, args.force))
    if not args.apply:
        print("\nReview the plan, then rerun with --apply. Existing files are skipped unless --force is supplied.")
    else:
        print("\nRestart the selected coding agent, trust the workspace, then run: python scripts/heisenberg_guard.py validate --workspace .")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
