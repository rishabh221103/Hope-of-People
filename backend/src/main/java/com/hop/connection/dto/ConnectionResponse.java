package com.hop.connection.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionResponse {

    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private String requesterRole;

    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private String receiverRole;

    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
