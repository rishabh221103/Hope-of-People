package com.hop.search.controller;

import com.hop.common.response.ApiResponse;
import com.hop.search.dto.GlobalSearchResponse;
import com.hop.search.service.GlobalSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    public ResponseEntity<ApiResponse<GlobalSearchResponse>> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false, defaultValue = "10") int limit) {

        GlobalSearchResponse response = globalSearchService.search(q, type, limit);
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved successfully.", response));
    }

    @GetMapping("/quick")
    public ResponseEntity<ApiResponse<GlobalSearchResponse>> quickSearch(
            @RequestParam(required = false, defaultValue = "") String q) {

        GlobalSearchResponse response = globalSearchService.quickSearch(q);
        return ResponseEntity.ok(ApiResponse.success("Quick search results retrieved successfully.", response));
    }
}
