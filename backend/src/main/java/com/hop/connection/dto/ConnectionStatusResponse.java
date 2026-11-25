package com.hop.connection.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionStatusResponse {

    private Long targetUserId;
    private Long connectionId;
    private Long id;
    private String status; // NONE, PENDING_SENT, PENDING_RECEIVED, CONNECTED, REJECTED
    private boolean canMessage;
}
