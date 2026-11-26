package com.hop.podcast.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePodcastRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    @NotBlank(message = "Audio URL or upload path is required")
    private String audioUrl;

    private String coverImageUrl;

    @NotBlank(message = "Host name is required")
    private String hostName;

    private String guestName;

    @NotBlank(message = "Category is required")
    private String category;

    private Integer durationSeconds;

    private Long assistanceRequestId;

    private Long businessCampaignId;
}
