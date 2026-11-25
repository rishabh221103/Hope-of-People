package com.hop.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryDto {

    private Long otherUserId;
    private String otherUserName;
    private String otherUserRole;
    private String otherUserAvatarUrl;
    private String lastMessage;
    private Instant lastMessageAt;
    private long unreadCount;
}
