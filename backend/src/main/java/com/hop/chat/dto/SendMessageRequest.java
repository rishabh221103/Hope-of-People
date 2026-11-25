package com.hop.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotNull(message = "Recipient ID is required.")
    private Long recipientId;

    @NotBlank(message = "Message content cannot be blank.")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters.")
    private String content;
}
