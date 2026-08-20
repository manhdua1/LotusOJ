package io.github.manhdua1.lotusoj.entity.submission;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Language {
    CPP("C++ (GCC 13.2)", ".cpp"),
    JAVA("Java 17 (OpenJDK)", ".java"),
    PYTHON("Python 3.11", ".py"),
    C("C (GCC 13.2)", ".c"),
    CSHARP("C# (.NET 8)", ".cs");

    private final String displayName;
    private final String fileExtension;
}
