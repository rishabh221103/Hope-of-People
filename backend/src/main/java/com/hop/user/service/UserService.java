package com.hop.user.service;

import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.user.dto.ChangePasswordRequest;
import com.hop.user.dto.UpdateProfileRequest;
import com.hop.user.dto.UserProfileResponse;
import com.hop.user.entity.Role;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String email) {
        User user = findUserByEmail(email);
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", email);
        User user = findUserByEmail(email);

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        User updatedUser = userRepository.save(user);
        log.info("Profile successfully updated for user ID: {}", updatedUser.getId());
        return mapToProfileResponse(updatedUser);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Changing password for user: {}", email);
        User user = findUserByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password provided does not match our records.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be the same as your existing password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password successfully updated for user ID: {}", user.getId());
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
