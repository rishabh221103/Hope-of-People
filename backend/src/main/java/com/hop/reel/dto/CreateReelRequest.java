package com.hop.reel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReelRequest {

    @NotBlank(message = "Video URL is required")
    private String videoUrl;

    private String thumbnailUrl;

    @NotBlank(message = "Caption is required")
    private String caption;

    private Integer durationSeconds;

    private Long assistanceRequestId;

    private Long businessCampaignId;
}
