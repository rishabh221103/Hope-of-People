package com.hop.common.pagination;

import java.util.List;

/**
 * Generic container for cursor-paginated results.
 * Reusable across feeds, chat messages, and notifications.
 */
public record CursorPage<T>(
        List<T> items,
        String nextCursor,
        boolean hasMore
) {
    public static <T> CursorPage<T> of(List<T> items, String nextCursor, boolean hasMore) {
        return new CursorPage<>(items, nextCursor, hasMore);
    }
}
