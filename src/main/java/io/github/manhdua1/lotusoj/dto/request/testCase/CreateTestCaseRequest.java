package io.github.manhdua1.lotusoj.dto.request.testCase;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTestCaseRequest {

    private Boolean isSample;
    private Integer orderIndex;
    private String input;
    private String expectedOutput;

}
