package com.hop.donation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDonationRequest {

    @NotNull(message = "Request ID is required.")
    private Long requestId;

    @NotNull(message = "Donation amount is required.")
    @DecimalMin(value = "1.00", message = "Donation amount must be at least 1.00.")
    private BigDecimal amount;

    private String paymentMethod;
}
