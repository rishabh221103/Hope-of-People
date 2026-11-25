package com.hop.assistance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistanceResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String title;
    private String description;
    private String category;
    private BigDecimal targetAmount;
    private BigDecimal raisedAmount;
    private String status;
    private String priority;
    private Boolean isAnonymous;
    private Boolean consentGiven;
    private Boolean isDirectDonorOrAdmin;
    private Instant createdAt;
    private Instant updatedAt;
    private List<DocumentResponse> documents;
}
