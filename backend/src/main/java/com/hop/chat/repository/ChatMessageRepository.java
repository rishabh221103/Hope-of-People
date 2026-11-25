package com.hop.chat.repository;

import com.hop.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :user1 AND m.recipient.id = :user2) OR " +
           "(m.sender.id = :user2 AND m.recipient.id = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient.id = :recipientId AND m.isRead = false")
    long countUnreadMessages(@Param("recipientId") Long recipientId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.isRead = false")
    long countUnreadFromSender(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.isRead = false")
    int markAsRead(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);

    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.recipient.id ELSE m.sender.id END " +
           "FROM ChatMessage m WHERE m.sender.id = :userId OR m.recipient.id = :userId")
    List<Long> findDistinctChatPartnerIds(@Param("userId") Long userId);

    @Query(value = "SELECT * FROM chat_messages WHERE " +
           "(sender_id = :user1 AND recipient_id = :user2) OR " +
           "(sender_id = :user2 AND recipient_id = :user1) " +
           "ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<ChatMessage> findLatestMessage(@Param("user1") Long user1, @Param("user2") Long user2);
}
