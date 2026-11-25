package com.hop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMetricsResponse {

    private long totalUsers;
    private long totalRequests;
    private long pendingRequests;
    private long approvedRequests;
    private long rejectedRequests;
    private long fulfilledRequests;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalRaisedAmount;
}
