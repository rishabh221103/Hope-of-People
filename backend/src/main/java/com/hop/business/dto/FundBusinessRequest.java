package com.hop.business.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class FundBusinessRequest {

    @NotNull(message = "Grant/Investment amount is required.")
    @DecimalMin(value = "1.00", message = "Amount must be at least $1.00.")
    private BigDecimal amount;

    @Size(max = 500, message = "Encouragement message cannot exceed 500 characters.")
    private String message;

    private Boolean isMentorOffer;
}
