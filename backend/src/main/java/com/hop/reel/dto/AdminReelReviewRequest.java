package com.hop.reel.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReelReviewRequest {

    @Size(max = 200, message = "Rejection reason must not exceed 200 characters.")
    private String reason;
}
