package com.hop.business.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessInvestmentResponse {

    private Long id;
    private Long campaignId;
    private Long donorId;
    private String donorName;
    private BigDecimal amount;
    private String message;
    private Boolean isMentorOffer;
    private Instant createdAt;
}
