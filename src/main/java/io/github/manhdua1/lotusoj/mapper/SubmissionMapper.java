package io.github.manhdua1.lotusoj.mapper;

import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(target = "problemId", source = "problem.id")
    SubmissionResponse toSubmissionResponse(Submission submission);
}
