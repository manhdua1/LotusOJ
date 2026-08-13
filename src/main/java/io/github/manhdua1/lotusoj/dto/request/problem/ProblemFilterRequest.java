package io.github.manhdua1.lotusoj.dto.request.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemFilterRequest {

    private String tag;
    private Problem.ProblemDifficulty difficulty;
    private Problem.ProblemStatus status;   // chỉ Admin/Setter mới được filter DRAFT
    private Boolean solved;         // lọc bài đã/chưa giải (so với currentUser)
    private String keyword;         // tìm theo title

}
