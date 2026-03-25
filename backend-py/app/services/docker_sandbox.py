"""
Docker Sandbox Service
Equivalent to: backend/src/services/dockerSandbox.ts
Manages Docker containers for secure code execution.
"""

import asyncio
import uuid

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("docker_sandbox")

# Language → Docker image mapping
LANGUAGE_IMAGES = {
    "C": "coding-war-judge:latest",
    "CPP": "coding-war-judge:latest",
    "PYTHON": "coding-war-judge:latest",
    "JAVA": "coding-war-judge:latest",
}

# Resource limits (SDRD: REQ-10.1–10.5)
DEFAULT_MEMORY_LIMIT = "256m"
DEFAULT_CPU_PERIOD = 100000
DEFAULT_CPU_QUOTA = 50000  # 50% of one CPU core
DEFAULT_PIDS_LIMIT = 64
NETWORK_DISABLED = True


async def create_sandbox(
    language: str,
    source_code: str,
    *,
    memory_limit: str = DEFAULT_MEMORY_LIMIT,
    timeout_ms: int | None = None,
) -> str:
    """
    Create a Docker container sandbox for code execution.
    Returns the container ID.
    """
    container_name = f"judge-{uuid.uuid4().hex[:12]}"
    image = LANGUAGE_IMAGES.get(language, LANGUAGE_IMAGES["PYTHON"])
    timeout = timeout_ms or settings.judge_timeout

    docker_cmd = [
        "docker", "create",
        "--name", container_name,
        # Security isolation
        "--network", "none",
        "--read-only",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        # Resource limits
        f"--memory={memory_limit}",
        f"--cpu-period={DEFAULT_CPU_PERIOD}",
        f"--cpu-quota={DEFAULT_CPU_QUOTA}",
        f"--pids-limit={DEFAULT_PIDS_LIMIT}",
        # Tmpfs for writable /tmp
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
        "--tmpfs", "/app:rw,noexec,nosuid,size=32m",
        # Environment
        "-e", f"TIMEOUT_MS={timeout}",
        image,
        "sleep", "infinity",
    ]

    proc = await asyncio.create_subprocess_exec(
        *docker_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode().strip()
        logger.error("Failed to create sandbox", error=error_msg)
        raise RuntimeError(f"Docker create failed: {error_msg}")

    container_id = stdout.decode().strip()
    logger.debug("Sandbox created", container=container_name)
    return container_name


async def start_sandbox(container_name: str) -> None:
    """Start a sandbox container."""
    proc = await asyncio.create_subprocess_exec(
        "docker", "start", container_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()


async def exec_in_sandbox(
    container_name: str,
    command: list[str],
    *,
    timeout_seconds: int = 30,
    stdin_data: bytes | None = None,
) -> tuple[int, str, str]:
    """
    Execute a command inside the sandbox.
    Returns (exit_code, stdout, stderr).
    """
    docker_cmd = ["docker", "exec", "-i", container_name] + command

    try:
        proc = await asyncio.create_subprocess_exec(
            *docker_cmd,
            stdin=asyncio.subprocess.PIPE if stdin_data else None,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=stdin_data),
            timeout=timeout_seconds,
        )

        return proc.returncode or 0, stdout.decode(errors="replace"), stderr.decode(errors="replace")

    except asyncio.TimeoutError:
        # Kill the process on timeout
        proc.kill()
        await proc.communicate()
        return -1, "", "Time Limit Exceeded"


async def copy_to_sandbox(container_name: str, src_path: str, dst_path: str) -> None:
    """Copy a file into the sandbox."""
    proc = await asyncio.create_subprocess_exec(
        "docker", "cp", src_path, f"{container_name}:{dst_path}",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()


async def write_to_sandbox(container_name: str, content: str, dst_path: str) -> None:
    """Write content to a file inside the sandbox."""
    proc = await asyncio.create_subprocess_exec(
        "docker", "exec", "-i", container_name,
        "sh", "-c", f"cat > {dst_path}",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate(input=content.encode())


async def destroy_sandbox(container_name: str) -> None:
    """Remove the sandbox container."""
    proc = await asyncio.create_subprocess_exec(
        "docker", "rm", "-f", container_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()
    logger.debug("Sandbox destroyed", container=container_name)
