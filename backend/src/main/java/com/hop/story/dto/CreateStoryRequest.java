package com.hop.story.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStoryRequest {

    @NotBlank(message = "Story title is required.")
    @Size(max = 200, message = "Story title cannot exceed 200 characters.")
    private String title;

    @NotBlank(message = "Story description is required.")
    private String description;

    @NotBlank(message = "Category is required.")
    private String category;

    @NotNull(message = "Donation target amount is required.")
    @DecimalMin(value = "1.00", message = "Target amount must be at least $1.00.")
    @DecimalMax(value = "500.00", message = "Maximum limit for 48-hour urgent stories is $500.00.")
    private BigDecimal targetAmount;

    private String beneficiaryName;

    private String location;

    private String urgencyTag;

    private String imageUrl;
}
