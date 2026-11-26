package com.hop.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostResponse {

    private Long id;
    private Long userId;
    private String authorName;
    private String authorEmail;
    private String authorCity;
    private String authorRole;

    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private String categoryIcon;

    private String title;
    private String content;
    private String tags;

    private Integer upvotesCount;
    private Integer repliesCount;
    private Integer viewsCount;

    private Boolean isPinned;
    private Boolean isLocked;
    private Boolean isUpvotedByCurrentUser;
    private Boolean hasAcceptedSolution;

    private Instant createdAt;
    private Instant updatedAt;

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
