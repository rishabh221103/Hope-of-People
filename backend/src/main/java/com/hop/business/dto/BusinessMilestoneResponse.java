package com.hop.business.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessMilestoneResponse {

    private Long id;
    private Long campaignId;
    private String title;
    private String description;
    private String status; // PLANNED, IN_PROGRESS, COMPLETED
    private Instant completedAt;
    private Instant createdAt;
}
