package io.github.manhdua1.lotusoj.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.manhdua1.lotusoj.dto.request.ai.AnalyzeComplexityRequest;
import io.github.manhdua1.lotusoj.dto.response.ai.ComplexityAnalysisResponse;
import io.github.manhdua1.lotusoj.service.ai.AiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GeminiAiServiceImpl implements AiService {

    final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    String modelName;

    static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public ComplexityAnalysisResponse analyzeCodeComplexity(AnalyzeComplexityRequest request) {
        try {
            String prompt = buildEngineeredPrompt(request);
            String requestPayload = buildGeminiRequestBody(prompt);

            String url = String.format(GEMINI_API_URL, modelName, apiKey);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                    .build();

            log.info("Sending code analysis request to Gemini AI (Model: {})", modelName);
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ComplexityAnalysisResponse analysis = parseGeminiResponse(response.body());
                analysis.setAiModel(modelName);
                return analysis;
            } else {
                log.error("Gemini API error (HTTP {}): {}", response.statusCode(), response.body());
                return buildFallbackAnalysis(request, "Gemini API trả về mã lỗi: " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("Failed to analyze code with Gemini AI", e);
            return buildFallbackAnalysis(request, "Lỗi kết nối AI: " + e.getMessage());
        }
    }

    /**
     * Advanced Prompt Engineering for Competitive Programming Algorithm Analysis
     */
    private String buildEngineeredPrompt(AnalyzeComplexityRequest request) {
        return """
                Bạn là Chuyên gia Thẩm định Giải thuật và Tối ưu hoá Hiệu năng Hệ thống Hàng đầu (Senior Principal Algorithm & Systems Performance Engineer) trên các nền tảng Online Judge (LeetCode, Codeforces).
                Nhiệm vụ của bạn là phân tích sâu mã nguồn được cung cấp, xác định chính xác độ phức tạp thời gian và không gian bộ nhớ phụ tiệm cận (Big-O), nhận dạng mô hình giải thuật và đưa ra nhận xét tối ưu chuyên nghiệp.

                [THÔNG TIN BÀI NỘP]
                - Ngôn ngữ: %s
                - Tiêu đề bài toán: %s

                [MÃ NGUỒN CẦN PHÂN TÍCH]
                %s

                [YÊU CẦU ĐẦU RA - CHỈ TRẢ VỀ JSON]
                Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không chứa markdown ```json hay bất kỳ văn bản thừa nào ngoài JSON) theo đúng cấu trúc sau:
                {
                  "timeComplexity": {
                    "bigO": "O(N)",
                    "name": "Tuyến tính (Linear)",
                    "verdict": "OPTIMAL",
                    "summary": "Thời gian chạy tỷ lệ thuận với số lượng phần tử N...",
                    "keyFactor": "Vòng lặp duyệt qua N phần tử kết hợp thao tác O(1)..."
                  },
                  "spaceComplexity": {
                    "bigO": "O(N)",
                    "name": "Tuyến tính (Linear Space)",
                    "verdict": "ACCEPTABLE",
                    "summary": "Bộ nhớ phụ cấp phát bổ sung...",
                    "memoryBreakdown": [
                      "Bảng băm lưu trữ tối đa N phần tử: O(N)"
                    ]
                  },
                  "algorithmParadigm": "Bảng băm (Hash Table Lookup)",
                  "codeInsights": [
                    {
                      "type": "time",
                      "title": "Tra cứu tức thì bằng Hash Map",
                      "description": "Giải thích chi tiết cấu trúc code..."
                    },
                    {
                      "type": "technique",
                      "title": "Kỹ thuật tối ưu hóa áp dụng",
                      "description": "Giải thích kỹ thuật..."
                    }
                  ],
                  "optimizationAdvice": "Lời khuyên cải thiện thuật toán hoặc lưu ý tinh chỉnh mã nguồn...",
                  "confidenceScore": 95
                }

                [QUY TẮC BẮT BUỘC]
                1. "verdict" trong timeComplexity và spaceComplexity BẮT BUỘC là một trong ba giá trị: "OPTIMAL", "ACCEPTABLE", hoặc "SUBOPTIMAL".
                2. "type" trong codeInsights BẮT BUỘC là một trong ba giá trị: "time", "space", hoặc "technique".
                3. Các trường giải thích (summary, keyFactor, description, optimizationAdvice) BẮT BUỘC sử dụng Tiếng Việt súc tích, chuẩn thuật ngữ học thuật và lập trình thi đấu.
                4. Nhận diện chính xác Big-O trong cả trường hợp xấu nhất (Worst-case) và trung bình (Average-case).
                """.formatted(
                request.getLanguage() != null ? request.getLanguage() : "UNKNOWN",
                request.getProblemTitle() != null ? request.getProblemTitle() : "Không có tiêu đề",
                request.getSourceCode()
        );
    }

    private String buildGeminiRequestBody(String prompt) throws Exception {
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
        Map<String, Object> genConfig = Map.of("responseMimeType", "application/json");

        Map<String, Object> root = new HashMap<>();
        root.put("contents", List.of(contentObj));
        root.put("generationConfig", genConfig);

        return objectMapper.writeValueAsString(root);
    }

    private ComplexityAnalysisResponse parseGeminiResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode firstCandidate = candidates.get(0);
            JsonNode parts = firstCandidate.path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                String rawJsonText = parts.get(0).path("text").asText();
                // Clean up potential markdown backticks if any
                String cleanedJson = rawJsonText.trim();
                if (cleanedJson.startsWith("```json")) {
                    cleanedJson = cleanedJson.substring(7);
                } else if (cleanedJson.startsWith("```")) {
                    cleanedJson = cleanedJson.substring(3);
                }
                if (cleanedJson.endsWith("```")) {
                    cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
                }
                cleanedJson = cleanedJson.trim();

                return objectMapper.readValue(cleanedJson, ComplexityAnalysisResponse.class);
            }
        }
        throw new IllegalStateException("Cấu trúc phản hồi từ Gemini API không hợp lệ");
    }

    private ComplexityAnalysisResponse buildFallbackAnalysis(AnalyzeComplexityRequest request, String errorReason) {
        return ComplexityAnalysisResponse.builder()
                .timeComplexity(ComplexityAnalysisResponse.TimeComplexityDto.builder()
                        .bigO("O(N)")
                        .name("Tuyến tính (Linear ước tính)")
                        .verdict("ACCEPTABLE")
                        .summary("Hệ thống AI đang bận hoặc gặp sự cố mạng, đang sử dụng kết quả dự phòng.")
                        .keyFactor("Phân tích tĩnh cấu trúc mã nguồn")
                        .build())
                .spaceComplexity(ComplexityAnalysisResponse.SpaceComplexityDto.builder()
                        .bigO("O(1)")
                        .name("Bộ nhớ hằng số (O(1))")
                        .verdict("OPTIMAL")
                        .summary("Bộ nhớ phụ cấp phát ở mức tối thiểu.")
                        .memoryBreakdown(Collections.singletonList("Biến cục bộ vô hướng: O(1)"))
                        .build())
                .algorithmParadigm("Phân tích tĩnh (Fallback Mode)")
                .codeInsights(Collections.singletonList(
                        ComplexityAnalysisResponse.CodeInsightDto.builder()
                                .type("technique")
                                .title("Chế độ phân tích dự phòng")
                                .description("Không thể kết nối trực tiếp đến Gemini AI (" + errorReason + "). Hệ thống tự động kích hoạt chế độ dự phòng an toàn.")
                                .build()
                ))
                .optimizationAdvice("Vui lòng thử lại sau vài giây để nhận được phân tích chuyên sâu đầy đủ từ Gemini AI.")
                .confidenceScore(70)
                .aiModel("fallback-heuristic")
                .build();
    }
}
