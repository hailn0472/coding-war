# Judge System Implementation

This document describes the implementation of the judge worker core logic (Task 13).

## Overview

The judge system consists of three main components:

1. **Compilation Service** (`compilationService.ts`) - Handles source code compilation for C, C++, Python, and Java
2. **Execution Service** (`executionService.ts`) - Executes compiled programs against test cases in sandboxed containers
3. **Judge Service** (`judgeService.ts`) - Main worker process that orchestrates compilation and execution

## Architecture

```
Submission Queue (Bull/Redis)
        ↓
Judge Worker (judgeService.ts)
        ↓
    ┌───┴───┐
    ↓       ↓
Compilation  Execution
Service      Service
    ↓           ↓
Docker      Docker
Sandbox     Sandbox
```

## Components

### 1. Compilation Service

**File:** `src/services/compilationService.ts`

**Purpose:** Compiles source code for different programming languages in isolated Docker containers.

**Supported Languages:**
- **C**: gcc with `-O2 -std=c11 -Wall -Wextra` flags
- **C++**: g++ with `-O2 -std=c++17 -Wall -Wextra` flags
- **Python**: Syntax validation using `python3 -m py_compile`
- **Java**: javac compilation to bytecode

**Key Functions:**
- `compileSourceCode(config)` - Main compilation function
- `compileC(sourceCode)` - C compilation wrapper
- `compileCPP(sourceCode)` - C++ compilation wrapper
- `compilePython(sourceCode)` - Python validation wrapper
- `compileJava(sourceCode)` - Java compilation wrapper

**Process:**
1. Create Docker container with resource limits (512MB memory, 1 CPU)
2. Write source code to container
3. Start container and execute compiler
4. Capture compilation output (success/error)
5. Read compiled binary (for compiled languages)
6. Clean up container

**Error Handling:**
- Compilation errors are captured and returned with error messages
- Timeout after 30 seconds
- Container cleanup on success or failure

**Requirements Validated:**
- REQ-6.2: Compile source code in sandbox
- REQ-6.3: Return compilation errors
- REQ-6.10: Support C, C++, Python, Java

### 2. Execution Service

**File:** `src/services/executionService.ts`

**Purpose:** Executes compiled programs against test cases with resource limits and security restrictions.

**Key Functions:**
- `executeTestCase(config)` - Main execution function

**Process:**
1. Create Docker container with strict security settings:
   - Memory limit (configurable)
   - CPU limit (1 core)
   - No network access
   - Read-only filesystem (except /workspace)
   - No new privileges
   - All capabilities dropped
   - Process limit (50)
2. Write binary/source code to container
3. Write test input to container
4. Execute program with timeout
5. Capture stdout, stderr, exit code
6. Measure execution time and memory usage
7. Compare output with expected output
8. Determine verdict
9. Clean up container

**Verdicts:**
- `ACCEPTED` - Output matches expected output
- `WRONG_ANSWER` - Output doesn't match
- `TIME_LIMIT_EXCEEDED` - Execution time exceeds limit
- `MEMORY_LIMIT_EXCEEDED` - Memory usage exceeds limit
- `RUNTIME_ERROR` - Program crashed or exited with non-zero code

**Output Comparison:**
- Exact match required
- Trailing whitespace ignored on each line
- Trailing newlines ignored

**Requirements Validated:**
- REQ-6.4: Execute against test cases
- REQ-6.5: Enforce time limit
- REQ-6.6: Compare output
- REQ-6.7: Return verdict
- REQ-6.8: Measure execution time and memory

### 3. Judge Service

**File:** `src/services/judgeService.ts`

**Purpose:** Main worker process that processes submissions from the queue.

**Key Functions:**
- `judgeSubmission(data)` - Main judging function

**Process:**
1. Update submission status to `COMPILING`
2. Compile source code using compilation service
3. If compilation fails:
   - Save compilation error
   - Update status to `COMPILATION_ERROR`
   - Return
4. Update submission status to `RUNNING`
5. Retrieve test cases from database
6. For each test case:
   - Execute program using execution service
   - Save test case result to database
   - Track metrics (execution time, memory)
7. Calculate final verdict:
   - If all test cases pass: `ACCEPTED`
   - Otherwise: First non-accepted verdict
8. Update submission with final verdict and metrics
9. Set `judgedAt` timestamp

**Database Updates:**
- Submission status transitions: `QUEUED` → `COMPILING` → `RUNNING` → Final verdict
- Test case results saved individually
- Execution metrics recorded (time, memory)
- Compilation errors saved

**Error Handling:**
- Database errors caught and logged
- Submission marked with error status
- Job marked as failed for retry

**Requirements Validated:**
- REQ-6.1: Queue submission for processing
- REQ-6.2: Compile source code
- REQ-6.3: Handle compilation errors
- REQ-6.4: Execute against test cases
- REQ-6.9: Process in FIFO order (handled by Bull queue)

## Security Features

### Docker Sandbox Security

All code execution happens in isolated Docker containers with:

1. **Resource Limits:**
   - Memory limit (configurable per problem)
   - CPU limit (1 core)
   - Process limit (50 processes)

2. **Network Isolation:**
   - No network access (`--network=none`)

3. **Filesystem Restrictions:**
   - Read-only root filesystem
   - Writable /workspace (tmpfs, limited size)
   - No executable permissions on tmpfs

4. **Security Options:**
   - No new privileges (`--security-opt=no-new-privileges`)
   - All capabilities dropped (`--cap-drop=ALL`)
   - Non-root user execution

5. **Container Cleanup:**
   - Containers destroyed after execution
   - Automatic cleanup on errors

## Testing

### Unit Tests

**Compilation Service Tests** (`compilationService.test.ts`):
- Valid code compilation for all languages
- Compilation error handling
- Syntax error detection
- Language-specific features (STL, imports, etc.)
- Edge cases (empty code, large code)

**Execution Service Tests** (`executionService.test.ts`):
- Correct output (ACCEPTED)
- Wrong output (WRONG_ANSWER)
- Runtime errors (RUNTIME_ERROR)
- Time limit exceeded (TIME_LIMIT_EXCEEDED)
- Output comparison (whitespace handling)
- Resource limit enforcement
- Edge cases (empty input/output, large input)

**Judge Service Tests** (`judgeService.test.ts`):
- End-to-end judging for all languages
- Compilation error handling
- Wrong answer detection
- Runtime error handling
- Time limit exceeded
- Test case result storage
- Database updates
- Edge cases (no test cases)

### Running Tests

```bash
# Run all judge system tests
npm test -- judge

# Run specific test file
npm test -- compilationService.test.ts
npm test -- executionService.test.ts
npm test -- judgeService.test.ts

# Run with coverage
npm test:coverage
```

**Prerequisites:**
- Docker must be running
- Judge Docker image must be built: `docker build -t coding-war-judge:latest -f Dockerfile.judge .`
- PostgreSQL database must be running
- Redis must be running

## Configuration

### Environment Variables

```env
# Judge System
JUDGE_CONCURRENCY=4           # Number of concurrent judge workers
JUDGE_TIMEOUT=30000           # Judge job timeout (ms)

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/codingwar
```

### Docker Image

Build the judge Docker image:

```bash
cd backend
docker build -t coding-war-judge:latest -f Dockerfile.judge .
```

The image includes:
- Ubuntu 22.04 base
- gcc (C compiler)
- g++ (C++ compiler)
- Python 3
- OpenJDK 17 (Java)

## Performance

### Compilation Times (Typical)

- C: 1-3 seconds
- C++: 2-5 seconds
- Python: 0.5-1 second (syntax check only)
- Java: 2-4 seconds

### Execution Times

- Depends on problem time limit
- Typical: 100ms - 2000ms per test case
- Overhead: ~100-200ms for container creation/cleanup

### Throughput

With default configuration (4 concurrent workers):
- ~10-20 submissions per minute
- Depends on:
  - Number of test cases per problem
  - Time limits
  - Compilation complexity

## Monitoring

### Logs

All judge operations are logged with structured logging:

```typescript
logger.info('Starting submission judging', {
  submissionId,
  userId,
  problemId,
  language,
});
```

Log levels:
- `DEBUG`: Detailed execution steps
- `INFO`: Major operations (compilation, execution)
- `WARN`: Non-critical issues (cleanup failures)
- `ERROR`: Critical errors (judging failures)

### Queue Metrics

Monitor queue health:

```typescript
import { getQueueMetrics } from './submissionQueue';

const metrics = await getQueueMetrics();
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 0,
//   total: 110
// }
```

## Troubleshooting

### Common Issues

**1. Docker not available**
```
Error: Failed to create sandbox container
```
Solution: Ensure Docker is running and accessible

**2. Judge image not found**
```
Error: Unable to find image 'coding-war-judge:latest'
```
Solution: Build the judge image: `docker build -t coding-war-judge:latest -f Dockerfile.judge .`

**3. Container cleanup failures**
```
Warning: Failed to destroy execution container
```
Solution: Manually clean up stale containers: `docker container prune -f`

**4. Compilation timeout**
```
Error: Compilation timeout after 30 seconds
```
Solution: Check if code is too complex or has infinite preprocessor loops

**5. Memory limit exceeded during compilation**
```
Error: Container killed due to memory limit
```
Solution: Increase compilation memory limit (default: 512MB)

## Future Improvements

1. **Caching:**
   - Cache compiled binaries for identical submissions
   - Reduce compilation overhead

2. **Parallel Test Case Execution:**
   - Run multiple test cases in parallel
   - Faster judging for problems with many test cases

3. **Custom Checker Support:**
   - Support for special judge programs
   - Handle problems with multiple correct answers

4. **Language Extensions:**
   - Add more languages (Rust, Go, JavaScript, etc.)
   - Support for language-specific libraries

5. **Resource Monitoring:**
   - More accurate memory measurement
   - CPU usage tracking
   - Disk I/O monitoring

6. **Distributed Judging:**
   - Multiple judge servers
   - Load balancing across servers
   - Horizontal scaling

## References

- Design Document: `.kiro/specs/coding-war-mvp-completion/design.md`
- Requirements: `.kiro/specs/coding-war-mvp-completion/requirements.md`
- Docker Sandbox: `src/services/dockerSandbox.ts`
- Submission Queue: `src/services/submissionQueue.ts`
