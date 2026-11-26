package com.hop.reel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Client response item format required by Section 4 specification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReelFeedItemResponse {

    private Long id;
    private String caption;
    private String category;
    private String playbackUrl;
    private String thumbnailUrl;
    private Integer durationSec;
    private Integer likeCount;
    private Integer commentCount;
    private Long viewCount;
    private boolean likedByMe;
    private String sourceLocation;
    private String supplierLink;
    private Long businessIdeaId;
    private UserSummary user;
    private Instant createdAt;

    // Optional cause linkage for transparent proof
    private Long assistanceRequestId;
    private String assistanceRequestTitle;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String avatar;
    }
}
