import { describe, it, expect } from '@jest/globals';
import { executeTestCase } from '../../src/../src/services/executionService';
import { compileSourceCode } from '../../src/../src/services/compilationService';

/**
 * Execution Service Tests
 * Tests test case execution for different languages and verdicts
 */

describe('Execution Service', () => {
  describe('C Execution', () => {
    it('should execute C program and return ACCEPTED for correct output', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '5 3',
        expectedOutput: '8',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.memoryUsed).toBeGreaterThan(0);
    }, 60000);

    it('should return WRONG_ANSWER for incorrect output', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("42\\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '43',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('WRONG_ANSWER');
      expect(result.stdout).toContain('42');
    }, 60000);

    it('should return RUNTIME_ERROR for program that crashes', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int *ptr = NULL;
    *ptr = 42;  // Segmentation fault
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('RUNTIME_ERROR');
      expect(result.exitCode).not.toBe(0);
    }, 60000);

    it('should return TIME_LIMIT_EXCEEDED for infinite loop', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    while(1) {
        // Infinite loop
    }
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
      expect(result.executionTime).toBeGreaterThanOrEqual(2000);
    }, 60000);
  });

  describe('C++ Execution', () => {
    it('should execute C++ program and return ACCEPTED', async () => {
      const sourceCode = `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'CPP', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'CPP',
        binary: compilation.binary,
        input: '10 20',
        expectedOutput: '30',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should handle C++ STL usage', async () => {
      const sourceCode = `
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {3, 1, 4, 1, 5};
    sort(v.begin(), v.end());
    for (int x : v) {
        cout << x << " ";
    }
    cout << endl;
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'CPP', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'CPP',
        binary: compilation.binary,
        input: '',
        expectedOutput: '1 1 3 4 5',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);
  });

  describe('Python Execution', () => {
    it('should execute Python program and return ACCEPTED', async () => {
      const sourceCode = `
a, b = map(int, input().split())
print(a + b)
`;

      const result = await executeTestCase({
        language: 'PYTHON',
        sourceCode,
        input: '7 8',
        expectedOutput: '15',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should return WRONG_ANSWER for incorrect Python output', async () => {
      const sourceCode = `
print("Hello")
`;

      const result = await executeTestCase({
        language: 'PYTHON',
        sourceCode,
        input: '',
        expectedOutput: 'World',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('WRONG_ANSWER');
    }, 60000);

    it('should return RUNTIME_ERROR for Python exception', async () => {
      const sourceCode = `
x = 1 / 0  # Division by zero
`;

      const result = await executeTestCase({
        language: 'PYTHON',
        sourceCode,
        input: '',
        expectedOutput: '',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('RUNTIME_ERROR');
    }, 60000);

    it('should handle Python with imports', async () => {
      const sourceCode = `
import math
print(int(math.sqrt(16)))
`;

      const result = await executeTestCase({
        language: 'PYTHON',
        sourceCode,
        input: '',
        expectedOutput: '4',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);
  });

  describe('Java Execution', () => {
    it('should execute Java program and return ACCEPTED', async () => {
      const sourceCode = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
`;

      const compilation = await compileSourceCode({ language: 'JAVA', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'JAVA',
        binary: compilation.binary,
        input: '15 25',
        expectedOutput: '40',
        timeLimit: 2000,
        memoryLimit: 512,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should return RUNTIME_ERROR for Java exception', async () => {
      const sourceCode = `
public class Solution {
    public static void main(String[] args) {
        int x = 1 / 0;  // ArithmeticException
    }
}
`;

      const compilation = await compileSourceCode({ language: 'JAVA', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'JAVA',
        binary: compilation.binary,
        input: '',
        expectedOutput: '',
        timeLimit: 2000,
        memoryLimit: 512,
      });

      expect(result.verdict).toBe('RUNTIME_ERROR');
    }, 60000);
  });

  describe('Output Comparison', () => {
    it('should ignore trailing whitespace', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("42   \\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '42',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should handle multiple lines correctly', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Line 1\\n");
    printf("Line 2\\n");
    printf("Line 3\\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: 'Line 1\nLine 2\nLine 3',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should detect difference in middle of output', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Line 1\\n");
    printf("Wrong\\n");
    printf("Line 3\\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: 'Line 1\nLine 2\nLine 3',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('WRONG_ANSWER');
    }, 60000);
  });

  describe('Resource Limits', () => {
    it('should enforce time limit', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    long long sum = 0;
    for (long long i = 0; i < 10000000000LL; i++) {
        sum += i;
    }
    printf("%lld\\n", sum);
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '0',
        timeLimit: 500, // 500ms - should timeout
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
    }, 60000);

    it('should measure execution time accurately', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Fast\\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: 'Fast',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
      expect(result.executionTime).toBeLessThan(2000);
      expect(result.executionTime).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("No input needed\\n");
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: 'No input needed',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should handle empty output', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: '',
        expectedOutput: '',
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);

    it('should handle large input', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", n);
    return 0;
}
`;

      const compilation = await compileSourceCode({ language: 'C', sourceCode });
      expect(compilation.success).toBe(true);

      const largeNumber = '123456789';
      const result = await executeTestCase({
        language: 'C',
        binary: compilation.binary,
        input: largeNumber,
        expectedOutput: largeNumber,
        timeLimit: 2000,
        memoryLimit: 256,
      });

      expect(result.verdict).toBe('ACCEPTED');
    }, 60000);
  });
});
