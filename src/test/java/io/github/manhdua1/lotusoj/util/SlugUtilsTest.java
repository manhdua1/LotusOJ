package io.github.manhdua1.lotusoj.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SlugUtilsTest {

    @Test
    @DisplayName("Should convert Vietnamese characters with diacritics to clean kebab-case")
    void toSlug_vietnameseString() {
        String input = "Tìm Đường Đi Ngắn Nhất (Dijkstra)";
        String slug = SlugUtils.toSlug(input);
        assertEquals("tim-duong-di-ngan-nhat-dijkstra", slug);
    }

    @Test
    @DisplayName("Should handle special characters, multiple spaces and punctuation")
    void toSlug_specialCharacters() {
        String input = "  Two Sum --- Array & Hash Map! @2026 #oj  ";
        String slug = SlugUtils.toSlug(input);
        assertEquals("two-sum-array-hash-map-2026-oj", slug);
    }

    @Test
    @DisplayName("Should return empty string for null or empty input")
    void toSlug_emptyInput() {
        assertEquals("", SlugUtils.toSlug(null));
        assertEquals("", SlugUtils.toSlug("   "));
    }
}
