package com.hop.chat.service;

import com.hop.chat.dto.ChatMessageResponse;
import com.hop.chat.dto.ConversationSummaryDto;
import com.hop.chat.dto.SendMessageRequest;
import com.hop.chat.entity.ChatMessage;
import com.hop.chat.repository.ChatMessageRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatRepository;
    private final UserRepository userRepository;
    private final UserConnectionRepository connectionRepository;
    private final NotificationService notificationService;

    @Transactional
    public ChatMessageResponse sendMessage(String senderEmail, SendMessageRequest request) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", senderEmail));

        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getRecipientId()));

        if (sender.getId().equals(recipient.getId())) {
            throw new BadRequestException("You cannot send a message to yourself.");
        }

        // Verify mutual connection or Admin privilege
        boolean isAdmin = sender.getRoles().stream()
                .anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
        if (!isAdmin) {
            Optional<UserConnection> connOpt = connectionRepository.findConnectionBetween(sender.getId(), recipient.getId());
            if (connOpt.isEmpty() || !"ACCEPTED".equalsIgnoreCase(connOpt.get().getStatus())) {
                throw new BadRequestException("You can only message users you are connected with. Please send a connection request first.");
            }
        }

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        ChatMessage saved = chatRepository.save(message);
        log.info("Chat message sent: from user {} to user {}", sender.getId(), recipient.getId());

        String snippet = request.getContent().trim();
        if (snippet.length() > 60) {
            snippet = snippet.substring(0, 57) + "...";
        }
        notificationService.createNotification(
                recipient,
                "New Message from " + sender.getFullName(),
                snippet,
                "DIRECT_MESSAGE",
                sender.getId(),
                "/messages"
        );

        return mapToResponse(saved, sender.getId());
    }

    @Transactional
    public List<ChatMessageResponse> getConversation(String userEmail, Long otherUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (!userRepository.existsById(otherUserId)) {
            throw new ResourceNotFoundException("User", "id", otherUserId);
        }

        // Auto mark incoming messages as read
        chatRepository.markAsRead(otherUserId, currentUser.getId());

        List<ChatMessage> messages = chatRepository.findConversation(currentUser.getId(), otherUserId);
        return messages.stream()
                .map(m -> mapToResponse(m, currentUser.getId()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryDto> getConversations(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Long currentUserId = currentUser.getId();

        // 1. Get partners from message history
        Set<Long> partnerIds = new HashSet<>(chatRepository.findDistinctChatPartnerIds(currentUserId));

        // 2. Also include all accepted connected users so user can initiate chat immediately
        List<UserConnection> acceptedConnections = connectionRepository.findAcceptedConnectionsForUser(currentUserId);
        for (UserConnection conn : acceptedConnections) {
            Long partnerId = conn.getRequester().getId().equals(currentUserId)
                    ? conn.getReceiver().getId()
                    : conn.getRequester().getId();
            partnerIds.add(partnerId);
        }

        List<ConversationSummaryDto> summaries = new ArrayList<>();
        for (Long partnerId : partnerIds) {
            Optional<User> partnerOpt = userRepository.findById(partnerId);
            if (partnerOpt.isEmpty()) continue;
            User partner = partnerOpt.get();

            Optional<ChatMessage> latestMsgOpt = chatRepository.findLatestMessage(currentUserId, partnerId);
            long unread = chatRepository.countUnreadFromSender(partnerId, currentUserId);

            String roleStr = partner.getRoles().stream()
                    .map(r -> r.getName().replace("ROLE_", ""))
                    .findFirst()
                    .orElse("USER");

            summaries.add(ConversationSummaryDto.builder()
                    .otherUserId(partner.getId())
                    .otherUserName(partner.getFirstName() + " " + partner.getLastName())
                    .otherUserRole(roleStr)
                    .otherUserAvatarUrl(null)
                    .lastMessage(latestMsgOpt.map(ChatMessage::getContent).orElse("No messages yet. Say hello!"))
                    .lastMessageAt(latestMsgOpt.map(ChatMessage::getCreatedAt).orElse(null))
                    .unreadCount(unread)
                    .build());
        }

        // Sort: Most recent message first; then new connections with null lastMessageAt
        summaries.sort((a, b) -> {
            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });

        return summaries;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        return chatRepository.countUnreadMessages(currentUser.getId());
    }

    @Transactional
    public void markAsRead(String userEmail, Long otherUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        chatRepository.markAsRead(otherUserId, currentUser.getId());
    }

    private ChatMessageResponse mapToResponse(ChatMessage msg, Long currentUserId) {
        User sender = msg.getSender();
        User recipient = msg.getRecipient();

        String senderRole = sender.getRoles().stream()
                .map(r -> r.getName().replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");

        String recipientRole = recipient.getRoles().stream()
                .map(r -> r.getName().replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");

        return ChatMessageResponse.builder()
                .id(msg.getId())
                .senderId(sender.getId())
                .senderName(sender.getFirstName() + " " + sender.getLastName())
                .senderRole(senderRole)
                .senderAvatarUrl(null)
                .recipientId(recipient.getId())
                .recipientName(recipient.getFirstName() + " " + recipient.getLastName())
                .recipientRole(recipientRole)
                .recipientAvatarUrl(null)
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .isMe(sender.getId().equals(currentUserId))
                .build();
    }
}
