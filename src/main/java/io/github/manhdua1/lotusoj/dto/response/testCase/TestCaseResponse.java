package io.github.manhdua1.lotusoj.dto.response.testCase;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResponse {
    private UUID id;
    private Boolean isSample;
    private Integer orderIndex;

    // Chỉ có giá trị nếu isSample=true HOẶC người xem là Admin/Setter (owner)
    private String input;
    private String expectedOutput;
}