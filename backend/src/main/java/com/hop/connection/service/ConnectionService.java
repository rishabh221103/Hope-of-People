package com.hop.connection.service;

import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.connection.dto.ConnectedUserDto;
import com.hop.connection.dto.ConnectionResponse;
import com.hop.connection.dto.ConnectionStatusResponse;
import com.hop.connection.entity.UserConnection;
import com.hop.connection.repository.UserConnectionRepository;
import com.hop.notification.service.NotificationService;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final UserConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ConnectionStatusResponse sendConnectionRequest(String requesterEmail, Long receiverId) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", requesterEmail));

        if (requester.getId().equals(receiverId)) {
            throw new BadRequestException("You cannot send a connection request to yourself.");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverId));

        Optional<UserConnection> existingOpt = connectionRepository.findConnectionBetween(requester.getId(), receiver.getId());
        if (existingOpt.isPresent()) {
            UserConnection existing = existingOpt.get();
            if ("ACCEPTED".equalsIgnoreCase(existing.getStatus())) {
                throw new BadRequestException("You are already connected with " + receiver.getFirstName() + ".");
            }
            if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                if (existing.getRequester().getId().equals(requester.getId())) {
                    throw new BadRequestException("You have already sent a pending connection request.");
                } else {
                    // Receiver is sending request to someone who already sent them one -> auto-accept!
                    existing.setStatus("ACCEPTED");
                    existing.setUpdatedAt(Instant.now());
                    UserConnection accepted = connectionRepository.save(existing);
                    notificationService.createNotification(
                            existing.getRequester(),
                            "Connection Accepted",
                            requester.getFullName() + " connected with you.",
                            "CONNECTION_ACCEPTED",
                            requester.getId(),
                            "/network"
                    );
                    return ConnectionStatusResponse.builder()
                            .targetUserId(receiverId)
                            .connectionId(accepted.getId())
                            .id(accepted.getId())
                            .status("CONNECTED")
                            .canMessage(true)
                            .build();
                }
            }
            // If previously rejected, allow re-requesting
            existing.setRequester(requester);
            existing.setReceiver(receiver);
            existing.setStatus("PENDING");
            existing.setUpdatedAt(Instant.now());
            UserConnection saved = connectionRepository.save(existing);
            return ConnectionStatusResponse.builder()
                    .targetUserId(receiverId)
                    .connectionId(saved.getId())
                    .id(saved.getId())
                    .status("PENDING_SENT")
                    .canMessage(false)
                    .build();
        }

        UserConnection connection = UserConnection.builder()
                .requester(requester)
                .receiver(receiver)
                .status("PENDING")
                .build();

        UserConnection saved = connectionRepository.save(connection);
        log.info("Connection request sent: from user {} to user {}", requester.getId(), receiver.getId());

        notificationService.createNotification(
                receiver,
                "New Connection Request",
                requester.getFullName() + " sent you a connection request.",
                "CONNECTION_REQUEST",
                requester.getId(),
                "/network"
        );

        return ConnectionStatusResponse.builder()
                .targetUserId(receiverId)
                .connectionId(saved.getId())
                .id(saved.getId())
                .status("PENDING_SENT")
                .canMessage(false)
                .build();
    }

    @Transactional
    public ConnectionResponse acceptConnectionRequest(String userEmail, Long connectionId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        UserConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("UserConnection", "id", connectionId));

        if (!connection.getReceiver().getId().equals(user.getId())) {
            throw new BadRequestException("Only the recipient of a connection request can accept it.");
        }

        if ("ACCEPTED".equalsIgnoreCase(connection.getStatus())) {
            return mapToResponse(connection);
        }

        connection.setStatus("ACCEPTED");
        connection.setUpdatedAt(Instant.now());
        UserConnection updated = connectionRepository.save(connection);
        log.info("Connection request accepted: connection ID {}", connectionId);

        notificationService.createNotification(
                connection.getRequester(),
                "Connection Accepted",
                user.getFullName() + " accepted your connection request.",
                "CONNECTION_ACCEPTED",
                user.getId(),
                "/network"
        );

        return mapToResponse(updated);
    }

    @Transactional
    public ConnectionResponse rejectConnectionRequest(String userEmail, Long connectionId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        UserConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("UserConnection", "id", connectionId));

        if (!connection.getReceiver().getId().equals(user.getId())) {
            throw new BadRequestException("Only the recipient of a connection request can reject it.");
        }

        connection.setStatus("REJECTED");
        connection.setUpdatedAt(Instant.now());
        UserConnection updated = connectionRepository.save(connection);
        log.info("Connection request rejected: connection ID {}", connectionId);

        return mapToResponse(updated);
    }

    @Transactional
    public void disconnect(String userEmail, Long connectionId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        UserConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("UserConnection", "id", connectionId));

        boolean isParticipant = connection.getRequester().getId().equals(user.getId()) ||
                                connection.getReceiver().getId().equals(user.getId());

        if (!isParticipant) {
            throw new BadRequestException("You are not authorized to remove this connection.");
        }

        connectionRepository.delete(connection);
        log.info("Connection removed: connection ID {}", connectionId);
    }

    @Transactional(readOnly = true)
    public ConnectionStatusResponse getConnectionStatus(String userEmail, Long targetUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (currentUser.getId().equals(targetUserId)) {
            return ConnectionStatusResponse.builder()
                    .targetUserId(targetUserId)
                    .connectionId(null)
                    .status("SELF")
                    .canMessage(false)
                    .build();
        }

        Optional<UserConnection> connOpt = connectionRepository.findConnectionBetween(currentUser.getId(), targetUserId);
        if (connOpt.isEmpty()) {
            return ConnectionStatusResponse.builder()
                    .targetUserId(targetUserId)
                    .connectionId(null)
                    .status("NONE")
                    .canMessage(false)
                    .build();
        }

        UserConnection conn = connOpt.get();
        String status;
        boolean canMessage = false;

        if ("ACCEPTED".equalsIgnoreCase(conn.getStatus())) {
            status = "CONNECTED";
            canMessage = true;
        } else if ("PENDING".equalsIgnoreCase(conn.getStatus())) {
            status = conn.getRequester().getId().equals(currentUser.getId()) ? "PENDING_SENT" : "PENDING_RECEIVED";
        } else {
            status = conn.getStatus();
        }

        return ConnectionStatusResponse.builder()
                .targetUserId(targetUserId)
                .connectionId(conn.getId())
                .id(conn.getId())
                .status(status)
                .canMessage(canMessage)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ConnectedUserDto> getMyConnections(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<UserConnection> connections = connectionRepository.findAcceptedConnectionsForUser(currentUser.getId());

        return connections.stream().map(conn -> {
            User other = conn.getRequester().getId().equals(currentUser.getId())
                    ? conn.getReceiver()
                    : conn.getRequester();

            String roleName = other.getRoles().stream()
                    .map(r -> r.getName().replace("ROLE_", ""))
                    .findFirst()
                    .orElse("COMMUNITY");

            return ConnectedUserDto.builder()
                    .connectionId(conn.getId())
                    .userId(other.getId())
                    .fullName(other.getFirstName() + " " + other.getLastName())
                    .email(other.getEmail())
                    .role(roleName)
                    .connectedAt(conn.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConnectionResponse> getPendingIncomingRequests(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        return connectionRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), "PENDING")
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConnectionResponse> getPendingOutgoingRequests(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        return connectionRepository.findByRequesterIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), "PENDING")
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getPendingCount(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        return connectionRepository.countByReceiverIdAndStatus(currentUser.getId(), "PENDING");
    }

    @Transactional(readOnly = true)
    public List<ConnectedUserDto> getDiscoverPeople(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<UserConnection> myConnections = connectionRepository.findAcceptedConnectionsForUser(currentUser.getId());
        List<Long> connectedOrPendingIds = myConnections.stream()
                .map(c -> c.getRequester().getId().equals(currentUser.getId()) ? c.getReceiver().getId() : c.getRequester().getId())
                .collect(Collectors.toList());
        connectedOrPendingIds.add(currentUser.getId());

        List<User> allUsers = userRepository.findAll();

        return allUsers.stream()
                .filter(u -> !connectedOrPendingIds.contains(u.getId()))
                .limit(15)
                .map(u -> {
                    String roleName = u.getRoles().stream()
                            .map(r -> r.getName().replace("ROLE_", ""))
                            .findFirst()
                            .orElse("MEMBER");

                    return ConnectedUserDto.builder()
                            .userId(u.getId())
                            .fullName(u.getFirstName() + " " + u.getLastName())
                            .email(u.getEmail())
                            .role(roleName)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ConnectionResponse mapToResponse(UserConnection conn) {
        User req = conn.getRequester();
        User rec = conn.getReceiver();

        String reqRole = req.getRoles().stream().map(r -> r.getName().replace("ROLE_", "")).findFirst().orElse("MEMBER");
        String recRole = rec.getRoles().stream().map(r -> r.getName().replace("ROLE_", "")).findFirst().orElse("MEMBER");

        return ConnectionResponse.builder()
                .id(conn.getId())
                .requesterId(req.getId())
                .requesterName(req.getFirstName() + " " + req.getLastName())
                .requesterEmail(req.getEmail())
                .requesterRole(reqRole)
                .receiverId(rec.getId())
                .receiverName(rec.getFirstName() + " " + rec.getLastName())
                .receiverEmail(rec.getEmail())
                .receiverRole(recRole)
                .status(conn.getStatus())
                .createdAt(conn.getCreatedAt())
                .updatedAt(conn.getUpdatedAt())
                .build();
    }
}
