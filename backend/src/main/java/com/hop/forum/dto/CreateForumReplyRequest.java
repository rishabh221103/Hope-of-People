package com.hop.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateForumReplyRequest {

    @NotBlank(message = "Reply content cannot be blank")
    @Size(min = 2, max = 5000, message = "Reply must be between 2 and 5000 characters")
    private String content;
}
