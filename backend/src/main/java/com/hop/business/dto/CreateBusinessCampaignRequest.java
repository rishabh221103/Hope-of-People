package com.hop.business.dto;

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
public class CreateBusinessCampaignRequest {

    @NotBlank(message = "Business name is required.")
    @Size(max = 200, message = "Business name cannot exceed 200 characters.")
    private String businessName;

    @NotBlank(message = "Industry is required.")
    private String industry; // FOOD_AND_BEVERAGE, TAILORING_TEXTILE, CARPENTRY_CRAFTS, RETAIL_GROCERY, TECH_REPAIR, AGRICULTURE, SERVICES, OTHER

    @NotBlank(message = "Tagline is required.")
    @Size(max = 255, message = "Tagline cannot exceed 255 characters.")
    private String tagline;

    @NotBlank(message = "Business description is required.")
    private String description;

    @NotBlank(message = "Specific equipment/tools needed must be specified.")
    private String equipmentNeeded;

    @NotNull(message = "Target funding budget is required.")
    @DecimalMin(value = "10.00", message = "Target budget must be at least $10.00.")
    private BigDecimal targetAmount;

    @Size(max = 150)
    private String location;

    private String sustainabilityPlan;
}
