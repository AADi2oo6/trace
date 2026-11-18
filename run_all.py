"""TRACE — Unified Dev Server Runner.

Starts both the FastAPI backend and Vite frontend concurrently with clean log
prefixes, automatic environment detection, and graceful shutdown on Ctrl+C.
"""

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
SERVER_DIR = ROOT_DIR / "server"
CLIENT_DIR = ROOT_DIR / "client"

# ANSI color codes for readable log streaming
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_banner() -> None:
    print(
        f"""
{CYAN}{BOLD}================================================================{RESET}
{CYAN}{BOLD}   TRACE — API Testing & Network Analysis Tool{RESET}
{CYAN}{BOLD}================================================================{RESET}
  {GREEN}► Frontend UI :{RESET} http://localhost:5173
  {GREEN}► Backend API :{RESET} http://localhost:8000
  {GREEN}► API Docs    :{RESET} http://localhost:8000/docs
  {GREEN}► Demo API    :{RESET} http://localhost:8000/demo
  {YELLOW}► Press Ctrl+C at any time to stop both servers.{RESET}
{CYAN}{BOLD}================================================================{RESET}
"""
    )


def stream_output(process: subprocess.Popen, prefix: str, color: str) -> None:
    """Stream stdout and stderr with a designated color prefix."""
    if process.stdout is None:
        return
    try:
        for line in iter(process.stdout.readline, ""):
            if not line:
                break
            cleaned = line.rstrip()
            if cleaned:
                print(f"{color}[{prefix}]{RESET} {cleaned}")
    except Exception:
        pass


def get_backend_command() -> list[str]:
    """Determine the best command to run the FastAPI backend."""
    # 1. Try uv in PATH
    try:
        subprocess.run(["uv", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return ["uv", "run", "uvicorn", "app.main:app", "--port", "8000", "--reload"]
    except Exception:
        pass

    # 2. Check for local server virtualenv
    if sys.platform == "win32":
        venv_python = SERVER_DIR / ".venv" / "Scripts" / "python.exe"
    else:
        venv_python = SERVER_DIR / ".venv" / "bin" / "python"

    if venv_python.exists():
        return [str(venv_python), "-m", "uvicorn", "app.main:app", "--port", "8000", "--reload"]

    # 3. Fallback to active python interpreter
    return [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000", "--reload"]


def terminate_process_tree(pid: int) -> None:
    """Safely terminate a process and all its children on Windows/Unix."""
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass


def main() -> None:
    print_banner()

    # Determine commands
    backend_cmd = get_backend_command()
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]

    print(f"{CYAN}[runner]{RESET} Starting backend in {SERVER_DIR}...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=SERVER_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    print(f"{CYAN}[runner]{RESET} Starting frontend in {CLIENT_DIR}...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=CLIENT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    # Launch streaming threads
    t_back = threading.Thread(
        target=stream_output,
        args=(backend_proc, "backend", CYAN),
        daemon=True,
    )
    t_front = threading.Thread(
        target=stream_output,
        args=(frontend_proc, "frontend", GREEN),
        daemon=True,
    )
    t_back.start()
    t_front.start()

    def handle_exit(signum, frame):
        print(f"\n{YELLOW}[runner]{RESET} Shutting down servers gracefully...")
        terminate_process_tree(backend_proc.pid)
        terminate_process_tree(frontend_proc.pid)
        print(f"{GREEN}[runner]{RESET} All servers stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # Monitor processes
    while True:
        b_ret = backend_proc.poll()
        f_ret = frontend_proc.poll()

        if b_ret is not None:
            print(f"{RED}[runner]{RESET} Backend process exited with code {b_ret}")
            terminate_process_tree(frontend_proc.pid)
            break
        if f_ret is not None:
            print(f"{RED}[runner]{RESET} Frontend process exited with code {f_ret}")
            terminate_process_tree(backend_proc.pid)
            break

        time.sleep(0.5)


if __name__ == "__main__":
    main()
