package com.hop.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumReplyResponse {

    private Long id;
    private Long postId;

    private Long userId;
    private String authorName;
    private String authorEmail;
    private String authorRole;

    private String content;
    private Boolean isSolution;
    private Integer upvotesCount;

    private Instant createdAt;
    private Instant updatedAt;
}
