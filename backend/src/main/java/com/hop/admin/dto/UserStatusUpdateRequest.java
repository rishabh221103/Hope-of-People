package com.hop.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateRequest {

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "^(ACTIVE|SUSPENDED|PENDING)$", message = "Status must be ACTIVE, SUSPENDED, or PENDING.")
    private String status;
}
