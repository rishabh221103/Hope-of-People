package com.hop.reel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReelCommentResponse {

    private Long id;
    private Long reelId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;
    private Instant createdAt;
}
