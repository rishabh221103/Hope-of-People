package com.hop.reel.dto;

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
public class ReelCommentRequest {

    @NotBlank(message = "Comment text cannot be blank.")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters.")
    private String content;
}
