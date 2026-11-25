package com.hop.assistance.service;

import com.hop.assistance.dto.DocumentResponse;
import com.hop.assistance.entity.AssistanceDocument;
import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceDocumentRepository;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.common.exception.UnauthorizedException;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final AssistanceDocumentRepository documentRepository;
    private final AssistanceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public DocumentResponse uploadDocument(Long requestId, String userEmail, MultipartFile file) {
        log.info("User {} uploading document for request ID {}", userEmail, requestId);

        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceRequest", "id", requestId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        boolean isOwner = request.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to attach documents to this request.");
        }

        String storedFilename = fileStorageService.storeFile(file);
        String contentType = (file.getContentType() != null) ? file.getContentType() : "application/octet-stream";

        AssistanceDocument document = AssistanceDocument.builder()
                .request(request)
                .fileName(file.getOriginalFilename())
                .fileUrl(storedFilename)
                .fileType(contentType)
                .fileSizeBytes(file.getSize())
                .build();

        AssistanceDocument saved = documentRepository.save(document);
        log.info("Document registered with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForRequest(Long requestId, String userEmail) {
        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceRequest", "id", requestId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        boolean isOwner = request.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to view documents for this request.");
        }

        return documentRepository.findByRequestId(requestId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceAndMetadata downloadDocument(Long documentId, String userEmail) {
        AssistanceDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceDocument", "id", documentId));

        Resource resource = fileStorageService.loadFileAsResource(document.getFileUrl());
        return new ResourceAndMetadata(resource, document.getFileName(), document.getFileType());
    }

    private DocumentResponse mapToResponse(AssistanceDocument entity) {
        return DocumentResponse.builder()
                .id(entity.getId())
                .requestId(entity.getRequest().getId())
                .fileName(entity.getFileName())
                .fileUrl("/api/v1/documents/download/" + entity.getId())
                .fileType(entity.getFileType())
                .fileSizeBytes(entity.getFileSizeBytes())
                .uploadedAt(entity.getUploadedAt())
                .build();
    }

    public record ResourceAndMetadata(Resource resource, String originalFilename, String contentType) {}
}
