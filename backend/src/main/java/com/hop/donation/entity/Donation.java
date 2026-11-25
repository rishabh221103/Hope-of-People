package com.hop.donation.entity;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private AssistanceRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_ref", nullable = false, unique = true, length = 100)
    private String transactionRef;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "COMPLETED";

    @Column(name = "donated_at", nullable = false, updatable = false)
    private Instant donatedAt;

    @PrePersist
    protected void onCreate() {
        this.donatedAt = Instant.now();
        if (this.status == null) {
            this.status = "COMPLETED";
        }
    }
}
