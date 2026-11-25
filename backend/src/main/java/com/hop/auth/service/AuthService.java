package com.hop.auth.service;

import com.hop.auth.dto.AuthResponse;
import com.hop.auth.dto.LoginRequest;
import com.hop.auth.dto.RegisterRequest;
import com.hop.auth.dto.UserSummaryResponse;
import com.hop.common.enums.RoleType;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.security.JwtTokenProvider;
import com.hop.security.UserPrincipal;
import com.hop.user.entity.Role;
import com.hop.user.entity.User;
import com.hop.user.repository.RoleRepository;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing registration request for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        String targetRoleName = (request.getRole() != null)
                ? request.getRole().name()
                : RoleType.ROLE_USER.name();

        Role role = roleRepository.findByName(targetRoleName)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(targetRoleName)
                        .description("Automatically initialized role " + targetRoleName)
                        .build()));

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone())
                .status("ACTIVE")
                .roles(new HashSet<>(Collections.singletonList(role)))
                .build();

        User savedUser = userRepository.save(user);
        log.info("Successfully registered user with ID: {}", savedUser.getId());

        List<String> roleNames = Collections.singletonList(role.getName());
        String token = tokenProvider.generateTokenFromUsername(savedUser.getEmail(), roleNames);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .roles(roleNames)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("Processing login request for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateToken(authentication);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(userPrincipal.getId())
                .email(userPrincipal.getEmail())
                .firstName(userPrincipal.getFirstName())
                .lastName(userPrincipal.getLastName())
                .roles(roles)
                .build();
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .roles(roles)
                .build();
    }
}
