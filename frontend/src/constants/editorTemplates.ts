import type { Language } from '../types/submission'

// Map LotusOJ languages to Monaco Editor language identifiers
export const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  CPP: 'cpp',
  JAVA: 'java',
  PYTHON: 'python',
  C: 'c',
  CSHARP: 'csharp',
}

// Starter templates for competitive programming
export const CODE_TEMPLATES: Record<Language, string> = {
  CPP: `#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Nhập dữ liệu và viết thuật toán tại đây

    return 0;
}
`,
  JAVA: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Nhập dữ liệu và viết thuật toán tại đây

    }
}
`,
  PYTHON: `import sys

def main():
    # Nhập dữ liệu và viết thuật toán tại đây
    pass

if __name__ == '__main__':
    main()
`,
  C: `#include <stdio.h>

int main() {
    // Nhập dữ liệu và viết thuật toán tại đây

    return 0;
}
`,
  CSHARP: `using System;

namespace LotusOJ {
    class Program {
        static void Main(string[] args) {
            // Nhập dữ liệu và viết thuật toán tại đây
        }
    }
}
`,
}
