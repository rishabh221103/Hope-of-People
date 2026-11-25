package com.hop.donation.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.common.enums.RequestStatus;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.donation.dto.CreateDonationRequest;
import com.hop.donation.dto.DonationResponse;
import com.hop.donation.entity.Donation;
import com.hop.donation.repository.DonationRepository;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public DonationResponse processDonation(String donorEmail, CreateDonationRequest request) {
        log.info("Processing donation of {} from user {} for request ID {}", request.getAmount(), donorEmail, request.getRequestId());

        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", donorEmail));

        // Enforce strict role boundary: Only Donors (and Admins) can donate!
        boolean isAuthorizedDonor = donor.getRoles().stream()
                .anyMatch(r -> "ROLE_DONOR".equalsIgnoreCase(r.getName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getName()));

        if (!isAuthorizedDonor) {
            log.warn("User {} attempted to donate without donor role. Roles: {}", donorEmail, donor.getRoles());
            throw new BadRequestException("Beneficiary accounts are not permitted to make donations. Only registered donors can contribute to causes.");
        }

        AssistanceRequest assistanceRequest = assistanceRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceRequest", "id", request.getRequestId()));

        if (assistanceRequest.getUser() != null && assistanceRequest.getUser().getId().equals(donor.getId())) {
            throw new BadRequestException("Beneficiaries cannot donate to their own assistance requests.");
        }

        if (!RequestStatus.APPROVED.name().equalsIgnoreCase(assistanceRequest.getStatus()) &&
            !RequestStatus.PENDING.name().equalsIgnoreCase(assistanceRequest.getStatus())) {
            throw new BadRequestException(String.format(
                    "Donations can only be accepted for open initiatives. Current status is '%s'.",
                    assistanceRequest.getStatus()
            ));
        }

        String transactionRef = "TXN-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();

        BigDecimal currentRaised = (assistanceRequest.getRaisedAmount() != null)
                ? assistanceRequest.getRaisedAmount()
                : BigDecimal.ZERO;
        BigDecimal newRaised = currentRaised.add(request.getAmount());
        assistanceRequest.setRaisedAmount(newRaised);

        if (newRaised.compareTo(assistanceRequest.getTargetAmount()) >= 0) {
            log.info("Assistance request ID {} reached target amount. Updating status to FULFILLED.", assistanceRequest.getId());
            assistanceRequest.setStatus(RequestStatus.FULFILLED.name());
        }

        assistanceRequestRepository.save(assistanceRequest);

        Donation donation = Donation.builder()
                .request(assistanceRequest)
                .donor(donor)
                .amount(request.getAmount())
                .transactionRef(transactionRef)
                .status("COMPLETED")
                .build();

        Donation saved = donationRepository.save(donation);
        log.info("Donation processed successfully with ID {} and transaction reference {}", saved.getId(), transactionRef);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getMyDonations(String donorEmail) {
        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", donorEmail));

        return donationRepository.findByDonorIdOrderByDonatedAtDesc(donor.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsForRequest(Long requestId) {
        if (!assistanceRequestRepository.existsById(requestId)) {
            throw new ResourceNotFoundException("AssistanceRequest", "id", requestId);
        }

        return donationRepository.findByRequestIdOrderByDonatedAtDesc(requestId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private DonationResponse mapToResponse(Donation entity) {
        User donor = entity.getDonor();
        String donorFullName = (donor != null) ? donor.getFirstName() + " " + donor.getLastName() : "Anonymous Donor";
        Long donorId = (donor != null) ? donor.getId() : null;
        String requestTitle = (entity.getRequest() != null) ? entity.getRequest().getTitle() : null;
        Long requestId = (entity.getRequest() != null) ? entity.getRequest().getId() : null;

        return DonationResponse.builder()
                .id(entity.getId())
                .requestId(requestId)
                .requestTitle(requestTitle)
                .donorId(donorId)
                .donorFullName(donorFullName)
                .amount(entity.getAmount())
                .transactionRef(entity.getTransactionRef())
                .status(entity.getStatus())
                .donatedAt(entity.getDonatedAt())
                .build();
    }
}
