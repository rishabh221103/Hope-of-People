package com.hop.reel.entity;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.business.entity.BusinessCampaign;
import com.hop.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "reels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assistance_request_id")
    private AssistanceRequest assistanceRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_campaign_id")
    private BusinessCampaign businessCampaign;

    @Column(name = "storage_provider", nullable = false, length = 20)
    @Builder.Default
    private String storageProvider = "local";

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "thumbnail_key")
    private String thumbnailKey;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String caption;

    @Column(length = 50)
    @Builder.Default
    private String category = "GENERAL";

    @Column(name = "source_location", length = 200)
    private String sourceLocation;

    @Column(name = "supplier_link", length = 500)
    private String supplierLink;

    @Column(name = "business_idea_id")
    private Long businessIdeaId;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Builder.Default
    @Column(name = "duration_seconds")
    private Integer durationSeconds = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReelStatus status = ReelStatus.PENDING_REVIEW;

    @Column(name = "rejection_reason", length = 200)
    private String rejectionReason;

    private Double latitude;
    private Double longitude;

    @Builder.Default
    @Column(name = "views_count", nullable = false)
    private Long viewsCount = 0L;

    @Builder.Default
    @Column(name = "likes_count", nullable = false)
    private Integer likesCount = 0;

    @Builder.Default
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Builder.Default
    @Column(name = "shares_count", nullable = false)
    private Integer sharesCount = 0;

    @Column(name = "consent_given", nullable = false)
    @Builder.Default
    private Boolean consentGiven = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
