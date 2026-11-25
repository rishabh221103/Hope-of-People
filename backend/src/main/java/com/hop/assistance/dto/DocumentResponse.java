package com.hop.assistance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private Long id;
    private Long requestId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSizeBytes;
    private Instant uploadedAt;
}
