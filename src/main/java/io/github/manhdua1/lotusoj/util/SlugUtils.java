package io.github.manhdua1.lotusoj.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern MULTIPLE_DASHES = Pattern.compile("-+");
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private SlugUtils() {}

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Replace 'đ' and 'Đ' manually since standard Unicode normalization doesn't decompose them
        String normalized = input.replace("đ", "d").replace("Đ", "d");

        // Decompose diacritics
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        normalized = DIACRITICS.matcher(normalized).replaceAll("");

        // Convert to lowercase
        normalized = normalized.toLowerCase(Locale.ROOT);

        // Replace whitespace with dash
        normalized = WHITESPACE.matcher(normalized).replaceAll("-");

        // Remove non-latin / non-word chars except dash
        normalized = NON_LATIN.matcher(normalized).replaceAll("");

        // Replace multiple consecutive dashes with single dash
        normalized = MULTIPLE_DASHES.matcher(normalized).replaceAll("-");

        // Trim leading and trailing dashes
        normalized = normalized.replaceAll("^-|-$", "");

        return normalized;
    }
}
