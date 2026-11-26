package com.hop.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultItem {
    private Long id;
    private String type; // CAUSE, REEL, PODCAST, FORUM_POST, BUSINESS
    private String title;
    private String description;
    private String category;
    private String url;
    private String thumbnailUrl;
    private String authorName;
    private Instant createdAt;
    private Map<String, Object> extra;
}
