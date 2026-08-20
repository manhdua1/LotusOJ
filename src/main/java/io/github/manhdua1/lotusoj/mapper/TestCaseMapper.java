package io.github.manhdua1.lotusoj.mapper;

import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TestCaseMapper {

    @Mapping(target = "isSample", source = "sample")
    TestCaseResponse toTestCaseResponse(TestCase testCase);

    List<TestCaseResponse> toTestCaseResponseList(List<TestCase> testCases);
}
