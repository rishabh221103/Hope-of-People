package com.hop.assistance.dto;

import com.hop.common.enums.PriorityLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssistanceRequest {

    @NotBlank(message = "Title is required.")
    @Size(max = 200, message = "Title must not exceed 200 characters.")
    private String title;

    @NotBlank(message = "Description is required.")
    private String description;

    @NotBlank(message = "Category is required.")
    @Size(max = 50, message = "Category must not exceed 50 characters.")
    private String category;

    @NotNull(message = "Target amount is required.")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than zero.")
    private BigDecimal targetAmount;

    private PriorityLevel priority;

    private Boolean isAnonymous;

    private Boolean consentGiven;

    private String city;

    private String state;

    private String postalCode;

    private String country;

    private Double latitude;

    private Double longitude;
}
