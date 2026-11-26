package com.hop.podcast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PodcastResponse {

    private Long id;
    private Long userId;
    private String creatorName;
    private String creatorEmail;
    private String creatorRole;

    private String title;
    private String description;
    private String audioUrl;
    private String coverImageUrl;
    private String hostName;
    private String guestName;
    private String category;
    private Integer durationSeconds;
    private Integer playsCount;
    private Integer likesCount;
    private Boolean isLikedByCurrentUser;
    private Instant publishedAt;
    private Instant createdAt;

    // Optional linked Assistance Request
    private Long assistanceRequestId;
    private String assistanceRequestTitle;
    private String assistanceCategory;
    private String assistanceTargetAmount;
    private String assistanceRaisedAmount;

    // Optional linked Business Campaign
    private Long businessCampaignId;
    private String businessName;
    private String businessTargetAmount;
    private String businessRaisedAmount;
}
