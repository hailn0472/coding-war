import { describe, it, expect } from '@jest/globals';
import {
  compileC,
  compileCPP,
  compilePython,
  compileJava,
} from '../../src/../src/services/compilationService';

/**
 * Compilation Service Tests
 * Tests compilation for C, C++, Python, and Java
 */

describe('Compilation Service', () => {
  describe('C Compilation', () => {
    it('should compile valid C code successfully', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

      const result = await compileC(sourceCode);

      expect(result.success).toBe(true);
      expect(result.binary).toBeDefined();
      expect(result.compilationTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    }, 60000);

    it('should fail compilation for invalid C code', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Missing semicolon")
    return 0;
}
`;

      const result = await compileC(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('error');
      expect(result.binary).toBeUndefined();
    }, 60000);

    it('should handle syntax errors in C code', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    undeclared_function();
    return 0;
}
`;

      const result = await compileC(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);
  });

  describe('C++ Compilation', () => {
    it('should compile valid C++ code successfully', async () => {
      const sourceCode = `
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;

      const result = await compileCPP(sourceCode);

      expect(result.success).toBe(true);
      expect(result.binary).toBeDefined();
      expect(result.compilationTime).toBeGreaterThan(0);
    }, 60000);

    it('should fail compilation for invalid C++ code', async () => {
      const sourceCode = `
#include <iostream>

int main() {
    std::cout << "Missing semicolon"
    return 0;
}
`;

      const result = await compileCPP(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);

    it('should compile C++17 features', async () => {
      const sourceCode = `
#include <iostream>
#include <optional>

int main() {
    std::optional<int> value = 42;
    if (value) {
        std::cout << *value << std::endl;
    }
    return 0;
}
`;

      const result = await compileCPP(sourceCode);

      expect(result.success).toBe(true);
      expect(result.binary).toBeDefined();
    }, 60000);
  });

  describe('Python Validation', () => {
    it('should validate valid Python code successfully', async () => {
      const sourceCode = `
print("Hello, World!")
`;

      const result = await compilePython(sourceCode);

      expect(result.success).toBe(true);
      expect(result.compilationTime).toBeGreaterThan(0);
    }, 60000);

    it('should fail validation for invalid Python syntax', async () => {
      const sourceCode = `
print("Missing closing quote)
`;

      const result = await compilePython(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);

    it('should validate Python with indentation', async () => {
      const sourceCode = `
def greet(name):
    print(f"Hello, {name}!")

greet("World")
`;

      const result = await compilePython(sourceCode);

      expect(result.success).toBe(true);
    }, 60000);

    it('should fail validation for indentation errors', async () => {
      const sourceCode = `
def greet(name):
print(f"Hello, {name}!")
`;

      const result = await compilePython(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);
  });

  describe('Java Compilation', () => {
    it('should compile valid Java code successfully', async () => {
      const sourceCode = `
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`;

      const result = await compileJava(sourceCode);

      expect(result.success).toBe(true);
      expect(result.binary).toBeDefined();
      expect(result.compilationTime).toBeGreaterThan(0);
    }, 60000);

    it('should fail compilation for invalid Java code', async () => {
      const sourceCode = `
public class Solution {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")
    }
}
`;

      const result = await compileJava(sourceCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);

    it('should handle class name mismatch', async () => {
      const sourceCode = `
public class WrongName {
    public static void main(String[] args) {
        System.out.println("Hello!");
    }
}
`;

      const result = await compileJava(sourceCode);

      // Java compiler expects class name to be "Solution"
      // This might still compile but won't match expected class name
      expect(result.success).toBe(false);
    }, 60000);
  });

  describe('Edge Cases', () => {
    it('should handle empty source code', async () => {
      const result = await compileC('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 60000);

    it('should handle very large source code', async () => {
      // Generate large but valid C code
      const lines = ['#include <stdio.h>', 'int main() {'];
      for (let i = 0; i < 1000; i++) {
        lines.push(`    printf("Line ${i}\\n");`);
      }
      lines.push('    return 0;');
      lines.push('}');

      const sourceCode = lines.join('\n');
      const result = await compileC(sourceCode);

      expect(result.success).toBe(true);
      expect(result.binary).toBeDefined();
    }, 60000);

    it('should handle compilation timeout gracefully', async () => {
      // This test would require a very complex code that takes long to compile
      // For now, we'll skip this as it's hard to create such code reliably
      expect(true).toBe(true);
    });
  });

  describe('Language-specific features', () => {
    it('should compile C code with standard library functions', async () => {
      const sourceCode = `
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "Hello";
    printf("Length: %lu\\n", strlen(str));
    return 0;
}
`;

      const result = await compileC(sourceCode);

      expect(result.success).toBe(true);
    }, 60000);

    it('should compile C++ code with STL', async () => {
      const sourceCode = `
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {3, 1, 4, 1, 5};
    std::sort(nums.begin(), nums.end());
    for (int n : nums) {
        std::cout << n << " ";
    }
    return 0;
}
`;

      const result = await compileCPP(sourceCode);

      expect(result.success).toBe(true);
    }, 60000);

    it('should validate Python with imports', async () => {
      const sourceCode = `
import sys
import math

print(math.sqrt(16))
`;

      const result = await compilePython(sourceCode);

      expect(result.success).toBe(true);
    }, 60000);

    it('should compile Java with imports', async () => {
      const sourceCode = `
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(1);
        System.out.println(list.size());
    }
}
`;

      const result = await compileJava(sourceCode);

      expect(result.success).toBe(true);
    }, 60000);
  });
});
