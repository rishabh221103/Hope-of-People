package com.hop.donation.repository;

import com.hop.donation.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    List<Donation> findByDonorIdOrderByDonatedAtDesc(Long donorId);

    List<Donation> findByRequestIdOrderByDonatedAtDesc(Long requestId);

    void deleteByRequestId(Long requestId);

    boolean existsByTransactionRef(String transactionRef);

    boolean existsByDonorIdAndRequestId(Long donorId, Long requestId);
}
