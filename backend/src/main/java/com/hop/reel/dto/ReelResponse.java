package com.hop.reel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReelResponse {

    private Long id;
    private Long userId;
    private String creatorName;
    private String creatorEmail;
    private String videoUrl;
    private String thumbnailUrl;
    private String caption;
    private Integer durationSeconds;
    private Integer viewsCount;
    private Integer likesCount;
    private Integer sharesCount;
    private Boolean isLikedByCurrentUser;
    private Instant createdAt;

    // Optional linked Assistance Request details
    private Long assistanceRequestId;
    private String assistanceRequestTitle;
    private String assistanceCategory;
    private String assistanceTargetAmount;
    private String assistanceRaisedAmount;

    // Optional linked Business Campaign details
    private Long businessCampaignId;
    private String businessName;
    private String businessTargetAmount;
    private String businessRaisedAmount;
}
