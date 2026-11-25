package com.hop.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAssistanceRequest {

    @NotBlank(message = "Action is required.")
    @Pattern(regexp = "^(APPROVE|REJECT)$", message = "Action must be either APPROVE or REJECT.")
    private String action;

    private String remarks;
}
