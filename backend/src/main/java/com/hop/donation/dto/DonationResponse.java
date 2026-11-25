package com.hop.donation.dto;

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
public class DonationResponse {

    private Long id;
    private Long requestId;
    private String requestTitle;
    private Long donorId;
    private String donorFullName;
    private BigDecimal amount;
    private String transactionRef;
    private String status;
    private Instant donatedAt;
}
