package com.hop.assistance.service;

import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "jpg", "jpeg", "png", "webp", "gif", "doc", "docx",
            "mp4", "webm", "mov", "avi", "mkv"
    );

    public FileStorageService(@Value("${app.upload.dir:uploads/documents}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Document storage directory initialized at: {}", this.fileStorageLocation);
        } catch (IOException ex) {
            throw new BadRequestException("Could not create directory for uploaded files: " + uploadDir, ex);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to upload document: file is empty.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Filename contains invalid relative path sequence: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(String.format("File extension '%s' is not allowed. Supported formats: %s",
                    extension, String.join(", ", ALLOWED_EXTENSIONS)));
        }

        String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("File successfully stored at: {}", targetLocation);
            return uniqueFilename;
        } catch (IOException ex) {
            throw new BadRequestException("Could not store file " + originalFilename + ". Please try again.", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Document file", "filename", fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Document file", "filename", fileName);
        }
    }

    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
            log.info("File successfully deleted: {}", filePath);
        } catch (IOException ex) {
            log.warn("Could not delete file {}: {}", fileName, ex.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex > 0 && dotIndex < filename.length() - 1) ? filename.substring(dotIndex + 1) : "";
    }
}
