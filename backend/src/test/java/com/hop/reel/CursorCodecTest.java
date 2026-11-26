package com.hop.reel;

import com.hop.common.exception.BadRequestException;
import com.hop.common.pagination.CursorCodec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CursorCodec Unit Tests")
class CursorCodecTest {

    @Test
    @DisplayName("Should encode and decode valid boundary ID correctly")
    void testEncodeAndDecodeValid() {
        Long originalId = 42L;
        String encoded = CursorCodec.encode(originalId);

        assertNotNull(encoded);
        assertFalse(encoded.isBlank());

        Long decoded = CursorCodec.decode(encoded);
        assertEquals(originalId, decoded);
    }

    @Test
    @DisplayName("Should return null when decoding null or empty cursor")
    void testDecodeNullOrEmpty() {
        assertNull(CursorCodec.decode(null));
        assertNull(CursorCodec.decode(""));
        assertNull(CursorCodec.decode("   "));
    }

    @Test
    @DisplayName("Should throw BadRequestException when cursor is tampered or malformed")
    void testDecodeTamperedCursor() {
        assertThrows(BadRequestException.class, () -> CursorCodec.decode("invalid-base64-content!@#$"));
        assertThrows(BadRequestException.class, () -> CursorCodec.decode("e30=")); // empty json "{}"
        assertThrows(BadRequestException.class, () -> CursorCodec.decode("eyJuYW1lIjoiZmFrZSJ9")); // json without "id"
    }
}
