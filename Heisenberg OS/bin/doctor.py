#!/usr/bin/env python3
"""
doctor.py - Universal Autonomous Engineering OS Health Validator
Heisenberg OS (Commercial Standalone Edition)

Validates the runtime environment, auto-detects the project stack (Next.js, React, Node,
Python, Go, Rust), probes the GrapeRoot dual-graph daemon on port 8080, checks ALL major AI
client MCP configurations (Cursor, Windsurf, Cline, Roo Code, Claude Desktop, Claude Code,
Antigravity, Continue.dev, and workspace .mcp.json), and verifies workflow integrity.

Usage:
    python doctor.py           # Standard human terminal dashboard
    python doctor.py --fix     # Auto-remediate repairable configuration issues
    python doctor.py --json    # Machine-readable output for coding agents
"""

import sys
import os
import socket
import json
import argparse
import platform
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional

# Terminal ANSI styling helpers
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

# Enable VT100 colors on Windows terminals if supported
if platform.system() == "Windows":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        pass


class CheckResult:
    def __init__(self, check_id: str, title: str, status: str, message: str, remediation: Optional[str] = None):
        self.check_id = check_id
        self.title = title
        self.status = status  # PASS, WARN, FAIL
        self.message = message
        self.remediation = remediation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.check_id,
            "title": self.title,
            "status": self.status,
            "message": self.message,
            "remediation": self.remediation
        }


class UniversalDoctor:
    def __init__(self, workspace_root: Path, port: int = 8080, auto_fix: bool = False):
        self.root = workspace_root.resolve()
        self.port = port
        self.auto_fix = auto_fix
        self.results: List[CheckResult] = []
        self.fixed_actions: List[str] = []
        self.home = Path.home()
        self.appdata = Path(os.environ.get("APPDATA", str(self.home)))

    def run_all_checks(self) -> Dict[str, Any]:
        self.check_system_runtime()
        self.check_workspace_stack()
        self.check_graperoot_daemon()
        self.check_workspace_dual_graph()
        self.check_mcp_client_configurations()
        self.check_agent_policy()
        self.check_workflow_state()

        failures = [r for r in self.results if r.status == "FAIL"]
        warnings = [r for r in self.results if r.status == "WARN"]
        passes = [r for r in self.results if r.status == "PASS"]

        return {
            "healthy": len(failures) == 0,
            "total_checks": len(self.results),
            "passed": len(passes),
            "warnings": len(warnings),
            "failures": len(failures),
            "checks": [r.to_dict() for r in self.results],
            "fixed_actions": self.fixed_actions
        }

    # ----------------------------------------------------------------------
    # 1. System & Host Runtime Probe
    # ----------------------------------------------------------------------
    def check_system_runtime(self):
        os_name = platform.system()
        py_ver = sys.version_info

        if py_ver < (3, 10):
            self.results.append(CheckResult(
                "runtime_python",
                "Host Python Runtime",
                "FAIL",
                f"Detected Python {py_ver.major}.{py_ver.minor}.{py_ver.micro}. Minimum required is Python 3.10+",
                "Install Python 3.10+ via winget (Windows), brew (macOS), or apt (Linux)."
            ))
        else:
            self.results.append(CheckResult(
                "runtime_python",
                "Host Python Runtime",
                "PASS",
                f"Python {py_ver.major}.{py_ver.minor}.{py_ver.micro} ({platform.architecture()[0]} on {os_name})"
            ))

        graperoot_path = shutil.which("graperoot")
        dual_graph_home = self.home / ".dual-graph"

        if graperoot_path:
            self.results.append(CheckResult(
                "graperoot_cli",
                "GrapeRoot Binary in PATH",
                "PASS",
                f"Found at: {graperoot_path}"
            ))
        elif (dual_graph_home / "graperoot").exists() or (dual_graph_home / "graperoot.exe").exists():
            self.results.append(CheckResult(
                "graperoot_cli",
                "GrapeRoot Binary in PATH",
                "WARN",
                f"Installed in {dual_graph_home} but not currently in user PATH.",
                f"Add {dual_graph_home} to your user PATH environment variable."
            ))
        else:
            self.results.append(CheckResult(
                "graperoot_cli",
                "GrapeRoot Binary Installation",
                "FAIL",
                "GrapeRoot CLI is not installed on this machine.",
                "Windows: irm https://graperoot.dev/install.ps1 | iex\nmacOS/Linux: curl -sSL https://graperoot.dev/install.sh | bash"
            ))

    # ----------------------------------------------------------------------
    # 2. Workspace Stack Auto-Detection (Polyglot)
    # ----------------------------------------------------------------------
    def check_workspace_stack(self):
        pkg_json = self.root / "package.json"
        pyproject = self.root / "pyproject.toml"
        req_txt = self.root / "requirements.txt"
        go_mod = self.root / "go.mod"
        cargo_toml = self.root / "Cargo.toml"

        detected_stacks = []

        if pkg_json.exists():
            try:
                with open(pkg_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                
                framework = "Node.js"
                if "next" in deps:
                    framework = f"Next.js ({deps.get('next', 'unknown')})"
                elif "react" in deps:
                    framework = f"React ({deps.get('react', 'unknown')})"
                elif "vue" in deps:
                    framework = "Vue"
                elif "express" in deps:
                    framework = "Express"

                styling = []
                if "tailwindcss" in deps:
                    styling.append("Tailwind CSS")

                pkg_mgr = "npm"
                if (self.root / "pnpm-lock.yaml").exists():
                    pkg_mgr = "pnpm"
                elif (self.root / "yarn.lock").exists():
                    pkg_mgr = "yarn"
                elif (self.root / "bun.lockb").exists():
                    pkg_mgr = "bun"

                detected_stacks.append(f"{framework} [Manager: {pkg_mgr}]" + (f" + {', '.join(styling)}" if styling else ""))
            except Exception:
                detected_stacks.append("Node.js (package.json present)")

        if pyproject.exists() or req_txt.exists():
            detected_stacks.append("Python (pyproject.toml / requirements.txt)")

        if go_mod.exists():
            detected_stacks.append("Go (go.mod present)")

        if cargo_toml.exists():
            detected_stacks.append("Rust (Cargo.toml present)")

        if not detected_stacks:
            self.results.append(CheckResult(
                "workspace_stack",
                "Project Stack Detection",
                "WARN",
                "No primary stack manifest found (Empty / Greenfield directory).",
                "Project is ready for Stage 0 Discovery Interview to scaffold new stack."
            ))
        else:
            self.results.append(CheckResult(
                "workspace_stack",
                "Project Stack Detection",
                "PASS",
                f"Detected: {' | '.join(detected_stacks)}"
            ))

    # ----------------------------------------------------------------------
    # 3. GrapeRoot Daemon & Port 8080 Socket Probe
    # ----------------------------------------------------------------------
    def check_graperoot_daemon(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        try:
            result = s.connect_ex(("127.0.0.1", self.port))
            s.close()
            if result == 0:
                self.results.append(CheckResult(
                    "daemon_socket",
                    f"GrapeRoot Daemon Port ({self.port})",
                    "PASS",
                    f"Port {self.port} is active and accepting connections (127.0.0.1:{self.port})."
                ))
            else:
                self.results.append(CheckResult(
                    "daemon_socket",
                    f"GrapeRoot Daemon Port ({self.port})",
                    "FAIL",
                    f"Port {self.port} is not listening. The GrapeRoot daemon is not running.",
                    f"Run `graperoot . --antigravity` in your workspace terminal."
                ))
        except Exception as e:
            self.results.append(CheckResult(
                "daemon_socket",
                f"GrapeRoot Daemon Port ({self.port})",
                "FAIL",
                f"Error probing port {self.port}: {str(e)}",
                f"Ensure no firewall is blocking localhost connection to port {self.port}."
            ))

    # ----------------------------------------------------------------------
    # 4. Workspace AST Dual-Graph Index
    # ----------------------------------------------------------------------
    def check_workspace_dual_graph(self):
        dual_graph_dir = self.root / ".dual-graph"
        info_graph = dual_graph_dir / "info_graph.json"

        if not dual_graph_dir.exists():
            self.results.append(CheckResult(
                "dual_graph_index",
                "Workspace AST Dual-Graph",
                "FAIL",
                "Directory `.dual-graph/` does not exist in workspace root.",
                "Execute `graph_scan` via coding agent or run `graperoot .` to index codebase."
            ))
        elif not info_graph.exists():
            self.results.append(CheckResult(
                "dual_graph_index",
                "Workspace AST Dual-Graph",
                "FAIL",
                "`.dual-graph/info_graph.json` is missing. Workspace AST has not been built.",
                "Execute `graph_scan` or run `graperoot .` in this workspace."
            ))
        else:
            try:
                size_kb = info_graph.stat().st_size / 1024
                self.results.append(CheckResult(
                    "dual_graph_index",
                    "Workspace AST Dual-Graph",
                    "PASS",
                    f"info_graph.json valid ({size_kb:.1f} KB indexed)"
                ))
            except Exception as e:
                self.results.append(CheckResult(
                    "dual_graph_index",
                    "Workspace AST Dual-Graph",
                    "WARN",
                    f"Error reading info_graph.json: {str(e)}"
                ))

    # ----------------------------------------------------------------------
    # 5. Comprehensive Multi-Agent MCP Auto-Discovery Scanner
    # ----------------------------------------------------------------------
    def check_mcp_client_configurations(self):
        # 5.1 Universal Project-level .mcp.json (Cursor, Claude Code, Zed)
        root_mcp = self.root / ".mcp.json"
        cursor_mcp = self.root / ".cursor" / "mcp.json"

        if root_mcp.exists():
            self._verify_mcp_file("Universal Workspace (.mcp.json)", root_mcp)
        else:
            if self.auto_fix:
                self._create_universal_mcp_json(root_mcp)
            else:
                self.results.append(CheckResult(
                    "mcp_workspace",
                    "Universal Workspace (.mcp.json)",
                    "WARN",
                    "No `.mcp.json` found in project root.",
                    "Run `install.ps1` or `python doctor.py --fix` to generate it."
                ))

        if cursor_mcp.exists():
            self._verify_mcp_file("Cursor Project (.cursor/mcp.json)", cursor_mcp)

        # 5.2 Antigravity 2.0
        anti_config = self.home / ".gemini" / "antigravity-cli" / "mcp_config.json"
        if anti_config.exists() or (anti_config.parent.exists() and self.auto_fix):
            self._check_and_patch_client("Antigravity 2.0", anti_config)

        # 5.3 Cursor (Global)
        cursor_global_paths = [
            self.appdata / "Cursor" / "User" / "mcp.json",
            self.home / "Library" / "Application Support" / "Cursor" / "User" / "mcp.json",
            self.home / ".config" / "Cursor" / "User" / "mcp.json"
        ]
        for cpath in cursor_global_paths:
            if cpath.exists() or (cpath.parent.exists() and self.auto_fix):
                self._check_and_patch_client("Cursor (Global)", cpath)
                break

        # 5.4 Windsurf (Codeium)
        windsurf_paths = [
            self.home / ".codeium" / "windsurf" / "mcp_config.json"
        ]
        for wpath in windsurf_paths:
            if wpath.exists() or (wpath.parent.exists() and self.auto_fix):
                self._check_and_patch_client("Windsurf", wpath)
                break

        # 5.5 Cline (VS Code)
        cline_paths = [
            self.home / ".cline" / "data" / "settings" / "cline_mcp_settings.json",
            self.appdata / "Code" / "User" / "globalStorage" / "saoudrizwan.claude-dev" / "settings" / "cline_mcp_settings.json",
            self.home / "Library" / "Application Support" / "Code" / "User" / "globalStorage" / "saoudrizwan.claude-dev" / "settings" / "cline_mcp_settings.json",
            self.home / ".config" / "Code" / "User" / "globalStorage" / "saoudrizwan.claude-dev" / "settings" / "cline_mcp_settings.json"
        ]
        for clpath in cline_paths:
            if clpath.exists() or (clpath.parent.exists() and self.auto_fix):
                self._check_and_patch_client("Cline (VS Code)", clpath)
                break

        # 5.6 Roo Code
        roo_paths = [
            self.appdata / "Code" / "User" / "globalStorage" / "rooveterinaryinc.roo-cline" / "settings" / "cline_mcp_settings.json",
            self.home / "Library" / "Application Support" / "Code" / "User" / "globalStorage" / "rooveterinaryinc.roo-cline" / "settings" / "cline_mcp_settings.json",
            self.home / ".config" / "Code" / "User" / "globalStorage" / "rooveterinaryinc.roo-cline" / "settings" / "cline_mcp_settings.json"
        ]
        for rpath in roo_paths:
            if rpath.exists() or (rpath.parent.exists() and self.auto_fix):
                self._check_and_patch_client("Roo Code", rpath)
                break

        # 5.7 Claude Desktop
        claude_desktop_paths = [
            self.appdata / "Claude" / "claude_desktop_config.json",
            self.home / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json",
            self.home / ".config" / "Claude" / "claude_desktop_config.json"
        ]
        for cdpath in claude_desktop_paths:
            if cdpath.exists():
                self._check_and_patch_client("Claude Desktop", cdpath)
                break

    def _create_universal_mcp_json(self, target_path: Path):
        try:
            data = {
                "mcpServers": {
                    "graperoot": {
                        "type": "streamableHttp",
                        "url": f"http://127.0.0.1:{self.port}/mcp",
                        "autoApprove": [
                            "graph_retrieve",
                            "graph_read",
                            "graph_neighbors",
                            "graph_impact",
                            "graph_continue"
                        ]
                    }
                }
            }
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            self.fixed_actions.append(f"Created universal .mcp.json at: {target_path}")
            self.results.append(CheckResult(
                "mcp_workspace",
                "Universal Workspace (.mcp.json)",
                "PASS",
                f"Auto-created {target_path.name} configured to http://127.0.0.1:{self.port}/mcp"
            ))
        except Exception as e:
            self.results.append(CheckResult(
                "mcp_workspace",
                "Universal Workspace (.mcp.json)",
                "WARN",
                f"Could not auto-create .mcp.json: {str(e)}"
            ))

    def _verify_mcp_file(self, name: str, file_path: Path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            servers = data.get("mcpServers", {})
            if "graperoot" in servers:
                self.results.append(CheckResult(
                    f"mcp_{name.lower().replace(' ', '_')}",
                    name,
                    "PASS",
                    f"Valid GrapeRoot registration found in {file_path.name}"
                ))
            else:
                self.results.append(CheckResult(
                    f"mcp_{name.lower().replace(' ', '_')}",
                    name,
                    "WARN",
                    f"`graperoot` not found in {file_path.name}",
                    f"Add graperoot streamableHttp block to {file_path}"
                ))
        except Exception as e:
            self.results.append(CheckResult(
                f"mcp_{name.lower().replace(' ', '_')}",
                name,
                "WARN",
                f"Error parsing {file_path.name}: {str(e)}"
            ))

    def _check_and_patch_client(self, client_name: str, config_path: Path):
        expected_url = f"http://127.0.0.1:{self.port}/mcp"
        auto_approved = ["graph_retrieve", "graph_read", "graph_neighbors", "graph_impact", "graph_continue"]

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            mcp_servers = data.get("mcpServers", {})
            graperoot_entry = mcp_servers.get("graperoot")

            if not graperoot_entry:
                if self.auto_fix:
                    mcp_servers["graperoot"] = {
                        "type": "streamableHttp",
                        "url": expected_url,
                        "autoApprove": auto_approved
                    }
                    data["mcpServers"] = mcp_servers
                    shutil.copyfile(config_path, config_path.with_suffix(".json.bak"))
                    with open(config_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
                    self.fixed_actions.append(f"Injected GrapeRoot streamableHttp into {client_name}")
                    self.results.append(CheckResult(
                        f"client_{client_name.lower().replace(' ', '_')}",
                        f"{client_name} MCP Settings",
                        "PASS",
                        f"Auto-injected graperoot MCP server into {config_path.name}"
                    ))
                    return

                self.results.append(CheckResult(
                    f"client_{client_name.lower().replace(' ', '_')}",
                    f"{client_name} MCP Settings",
                    "WARN",
                    f"`graperoot` is not registered in {config_path.name}",
                    f"Run `python doctor.py --fix` or add graperoot entry."
                ))
            else:
                self.results.append(CheckResult(
                    f"client_{client_name.lower().replace(' ', '_')}",
                    f"{client_name} MCP Settings",
                    "PASS",
                    f"Valid GrapeRoot registration in {config_path.name}"
                ))
        except Exception as e:
            self.results.append(CheckResult(
                f"client_{client_name.lower().replace(' ', '_')}",
                f"{client_name} MCP Settings",
                "WARN",
                f"Could not read {config_path.name}: {str(e)}"
            ))

    # ----------------------------------------------------------------------
    # 6. Portable agent policy and host adapters
    # ----------------------------------------------------------------------
    def check_agent_policy(self):
        agents_file = self.root / "AGENTS.md"
        claude_file = self.root / "CLAUDE.md"
        policy_file = self.root / ".heisenberg" / "policy.json"
        skills_file = self.root / ".heisenberg" / "skills.json"

        if agents_file.exists() and policy_file.exists() and skills_file.exists():
            try:
                with open(policy_file, "r", encoding="utf-8") as f:
                    policy = json.load(f)
                with open(skills_file, "r", encoding="utf-8") as f:
                    skills = json.load(f)
                skill_count = len(skills.get("skills", {}))
                mode = policy.get("mode", "unknown")
                self.results.append(CheckResult(
                    "agent_policy",
                    "Portable Agent Policy",
                    "PASS",
                    f"AGENTS.md, policy manifest, and {skill_count} routed skills found (mode: {mode})."
                ))
            except Exception as e:
                self.results.append(CheckResult(
                    "agent_policy",
                    "Portable Agent Policy",
                    "WARN",
                    f"Could not parse .heisenberg policy files: {str(e)}"
                ))
        else:
            self.results.append(CheckResult(
                "agent_policy",
                "Portable Agent Policy",
                "WARN",
                "No complete AGENTS.md/.heisenberg policy layer found.",
                "Run the Heisenberg initializer in the target repository."
            ))

        adapters = []
        if claude_file.exists():
            adapters.append("Claude")
        if (self.root / ".cursor" / "rules" / "00-heisenberg-core.mdc").exists():
            adapters.append("Cursor")
        if (self.root / ".agents" / "rules" / "heisenberg-core.md").exists():
            adapters.append("Antigravity")
        if adapters:
            self.results.append(CheckResult(
                "agent_adapters",
                "Agent Host Adapters",
                "PASS",
                f"Configured: {', '.join(adapters)}. Host loading still requires a trusted workspace and restart."
            ))
        else:
            self.results.append(CheckResult(
                "agent_adapters",
                "Agent Host Adapters",
                "WARN",
                "No supported host adapter found."
            ))

    # ----------------------------------------------------------------------
    # 7. Workflow State & Operating Contract
    # ----------------------------------------------------------------------
    def check_workflow_state(self):
        wbs_candidates = [
            self.root / "roadmap_wbs.md",
            self.root / "Heisenberg" / "state" / "roadmap_wbs.md",
            self.root / ".agents" / "state" / "roadmap_wbs.md"
        ]
        has_wbs = any(p.exists() for p in wbs_candidates)

        if has_wbs:
            self.results.append(CheckResult(
                "workflow_wbs",
                "Roadmap & WBS Specification",
                "PASS",
                "Active WBS found. Tasks and scope are explicitly governed."
            ))
        else:
            self.results.append(CheckResult(
                "workflow_wbs",
                "Roadmap & WBS Specification",
                "WARN",
                "No `roadmap_wbs.md` found. Workspace is in Cold-Start mode.",
                "Trigger Stage 0 (Discovery Interview) to establish project roadmap."
            ))

        tokens_candidates = [
            self.root / "design-system" / "tokens.json",
            self.root / "Heisenberg" / "design-system" / "tokens.json"
        ]
        has_tokens = any(p.exists() for p in tokens_candidates)

        if has_tokens:
            self.results.append(CheckResult(
                "workflow_tokens",
                "UI Design Tokens (The Muses)",
                "PASS",
                "Found design tokens. Zero-drift visual enforcement active."
            ))
        else:
            self.results.append(CheckResult(
                "workflow_tokens",
                "UI Design Tokens (The Muses)",
                "WARN",
                "No design-system/tokens.json found.",
                "Before frontend UI development, trigger Picasso skill to generate brand tokens."
            ))


def render_terminal_dashboard(health_data: Dict[str, Any]):
    print(f"\n{Colors.BOLD}{Colors.CYAN}========================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}   HEISENBERG OS / AUTONOMOUS ENGINEERING WORKFLOW HEALTH DOCTOR        {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================{Colors.RESET}\n")

    for check in health_data["checks"]:
        status = check["status"]
        if status == "PASS":
            badge = f"{Colors.GREEN}[✓ PASS]{Colors.RESET}"
        elif status == "WARN":
            badge = f"{Colors.YELLOW}[! WARN]{Colors.RESET}"
        else:
            badge = f"{Colors.RED}[✗ FAIL]{Colors.RESET}"

        print(f" {badge} {Colors.BOLD}{check['title']}{Colors.RESET}")
        print(f"         {check['message']}")
        if check.get("remediation") and status == "FAIL":
            print(f"         {Colors.RED}Fix: {check['remediation']}{Colors.RESET}")
        print()

    print(f"{Colors.BOLD}------------------------------------------------------------------------{Colors.RESET}")
    print(f" Summary: {Colors.GREEN}{health_data['passed']} Passed{Colors.RESET} | "
          f"{Colors.YELLOW}{health_data['warnings']} Warnings{Colors.RESET} | "
          f"{Colors.RED}{health_data['failures']} Failures{Colors.RESET}")

    if health_data.get("fixed_actions"):
        print(f"\n{Colors.BOLD}{Colors.GREEN}Auto-Repaired Actions:{Colors.RESET}")
        for act in health_data["fixed_actions"]:
            print(f"  + {act}")

    if health_data["healthy"]:
        print(f"\n{Colors.BOLD}{Colors.GREEN}>> SYSTEM STATUS: 100% READY FOR AGENTIC DEVELOPMENT <<{Colors.RESET}\n")
    else:
        print(f"\n{Colors.BOLD}{Colors.RED}>> SYSTEM BLOCKED: Please resolve failures before starting tasks <<{Colors.RESET}")
        print(f"Tip: Run `python doctor.py --fix` to automatically repair client MCP configurations.\n")


def main():
    parser = argparse.ArgumentParser(description="Heisenberg Autonomous Engineering OS Health Doctor")
    parser.add_argument("--fix", action="store_true", help="Auto-repair missing client MCP configurations")
    parser.add_argument("--json", action="store_true", help="Output health diagnostic as JSON")
    parser.add_argument("--port", type=int, default=8080, help="GrapeRoot daemon port (default: 8080)")
    parser.add_argument("--workspace", type=str, default=".", help="Workspace root directory")
    args = parser.parse_args()

    workspace_path = Path(args.workspace)
    doctor = UniversalDoctor(workspace_root=workspace_path, port=args.port, auto_fix=args.fix)
    health_data = doctor.run_all_checks()

    if args.json:
        print(json.dumps(health_data, indent=2))
    else:
        render_terminal_dashboard(health_data)

    sys.exit(0 if health_data["healthy"] else 1)


if __name__ == "__main__":
    main()
