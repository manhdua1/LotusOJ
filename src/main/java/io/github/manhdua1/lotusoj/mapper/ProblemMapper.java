package io.github.manhdua1.lotusoj.mapper;

import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.problem.Tag;
import org.mapstruct.*;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring", uses = {TestCaseMapper.class})
public interface ProblemMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "totalSubmissions", ignore = true)
    @Mapping(target = "totalAccepted", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Problem toProblem(CreateProblemRequest request);

    @Mapping(target = "tags", source = "tags", qualifiedByName = "mapTagsToStringList")
    @Mapping(target = "acceptanceRate", expression = "java(calculateAcceptanceRate(problem))")
    @Mapping(target = "sampleTestCases", ignore = true)
    ProblemDetailResponse toProblemDetailResponse(Problem problem);

    @Mapping(target = "tags", source = "tags", qualifiedByName = "mapTagsToStringList")
    @Mapping(target = "acceptanceRate", expression = "java(calculateAcceptanceRate(problem))")
    @Mapping(target = "solvedByCurrentUser", ignore = true)
    ProblemSummaryResponse toProblemSummaryResponse(Problem problem);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "totalSubmissions", ignore = true)
    @Mapping(target = "totalAccepted", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateProblemFromDto(UpdateProblemRequest request, @MappingTarget Problem problem);

    @Named("mapTagsToStringList")
    default List<String> mapTagsToStringList(Set<Tag> tags) {
        if (tags == null || tags.isEmpty()) {
            return Collections.emptyList();
        }
        return tags.stream()
                .map(Tag::getName)
                .sorted()
                .toList();
    }

    default Double calculateAcceptanceRate(Problem problem) {
        if (problem == null || problem.getTotalSubmissions() == null || problem.getTotalSubmissions() == 0) {
            return 0.0;
        }
        double rate = ((double) problem.getTotalAccepted() / problem.getTotalSubmissions()) * 100.0;
        return Math.round(rate * 100.0) / 100.0;
    }
}
