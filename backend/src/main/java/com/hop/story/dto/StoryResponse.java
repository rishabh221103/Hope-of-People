package com.hop.story.dto;

import com.hop.assistance.dto.DocumentResponse;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryResponse {

    private Long id;
    private Long requestId;
    private Long userId;
    private String userEmail;
    private String beneficiaryName;
    private String title;
    private String description;
    private String category;
    private BigDecimal targetAmount;
    private BigDecimal raisedAmount;
    private String urgency;
    private String location;
    private String imageUrl;
    private Instant createdAt;
    private Instant expiresAt;
    private Long secondsRemaining;
    private String status;
    private List<DocumentResponse> documents;
}
