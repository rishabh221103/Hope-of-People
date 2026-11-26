package com.hop.podcast.entity;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.business.entity.BusinessCampaign;
import com.hop.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "podcasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Podcast {

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

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "audio_url", nullable = false, columnDefinition = "TEXT")
    private String audioUrl;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "host_name", nullable = false, length = 120)
    private String hostName;

    @Column(name = "guest_name", length = 120)
    private String guestName;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "plays_count", nullable = false)
    @Builder.Default
    private Integer playsCount = 0;

    @Column(name = "likes_count", nullable = false)
    @Builder.Default
    private Integer likesCount = 0;

    @CreationTimestamp
    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
