package com.hop.assistance.controller;

import com.hop.assistance.dto.DocumentResponse;
import com.hop.assistance.service.DocumentService;
import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload/{requestId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DocumentResponse response = documentService.uploadDocument(requestId, currentUser.getUsername(), file);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Document uploaded and attached successfully.", response));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocumentsForRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<DocumentResponse> documents = documentService.getDocumentsForRequest(requestId, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Request documents retrieved successfully.", documents));
    }

    @GetMapping("/download/{documentId}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String email = (currentUser != null) ? currentUser.getUsername() : null;
        DocumentService.ResourceAndMetadata result = documentService.downloadDocument(documentId, email);

        String disposition = (result.contentType() != null && 
                (result.contentType().startsWith("image/") || result.contentType().startsWith("video/")))
                ? "inline"
                : "attachment";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + result.originalFilename() + "\"")
                .body(result.resource());
    }
}
