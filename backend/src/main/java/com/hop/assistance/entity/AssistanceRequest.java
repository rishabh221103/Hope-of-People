package com.hop.assistance.entity;

import com.hop.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "assistance_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssistanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String category;

    @Builder.Default
    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "raised_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal raisedAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Builder.Default
    @Column(name = "is_urgent_story", nullable = false)
    private Boolean isUrgentStory = false;

    @Builder.Default
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = false;

    @Builder.Default
    @Column(name = "consent_given", nullable = false)
    private Boolean consentGiven = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "story_beneficiary_name", length = 150)
    private String storyBeneficiaryName;

    @Column(name = "story_location", length = 150)
    private String storyLocation;

    @Column(name = "story_urgency_tag", length = 100)
    private String storyUrgencyTag;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Builder.Default
    @Column(length = 100)
    private String country = "USA";

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.raisedAmount == null) {
            this.raisedAmount = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.priority == null) {
            this.priority = "MEDIUM";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
