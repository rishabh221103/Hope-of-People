package com.hop.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResponse {
    private String query;
    private int totalCount;
    private List<SearchResultItem> causes;
    private List<SearchResultItem> reels;
    private List<SearchResultItem> podcasts;
    private List<SearchResultItem> forumPosts;
    private List<SearchResultItem> businesses;
    private List<SearchResultItem> allResults;
}
