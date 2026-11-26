package com.hop.common.pagination;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hop.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Utility for encoding and decoding opaque URL-safe Base64 JSON cursors.
 * Protects database identity and prevents client tampering.
 * Invalid or malformed cursors result in an immediate 400 Bad Request.
 */
@Slf4j
public final class CursorCodec {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private CursorCodec() {
        // Prevent instantiation
    }

    /**
     * Encodes an entity ID (or keyset map) into an opaque Base64 URL-safe cursor.
     */
    public static String encode(Long id) {
        if (id == null) return null;
        try {
            String json = OBJECT_MAPPER.writeValueAsString(Map.of("id", id));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize cursor payload for id: {}", id, e);
            throw new RuntimeException("Internal cursor encoding error", e);
        }
    }

    /**
     * Decodes an opaque Base64 URL-safe cursor and extracts the boundary ID.
     * Throws BadRequestException (400) if null, empty, malformed, or tampered.
     */
    public static Long decode(String cursor) {
        if (cursor == null || cursor.trim().isEmpty()) {
            return null;
        }

        try {
            byte[] decodedBytes = Base64.getUrlDecoder().decode(cursor.trim());
            String json = new String(decodedBytes, StandardCharsets.UTF_8);

            @SuppressWarnings("unchecked")
            Map<String, Object> map = OBJECT_MAPPER.readValue(json, Map.class);
            Object idObj = map.get("id");
            if (idObj == null) {
                throw new BadRequestException("Invalid cursor format: missing identifier payload.");
            }

            if (idObj instanceof Number number) {
                return number.longValue();
            } else {
                return Long.parseLong(idObj.toString());
            }
        } catch (IllegalArgumentException | JsonProcessingException e) {
            log.warn("Failed to decode client cursor: '{}'", cursor);
            throw new BadRequestException("Invalid or malformed pagination cursor.");
        }
    }
}
