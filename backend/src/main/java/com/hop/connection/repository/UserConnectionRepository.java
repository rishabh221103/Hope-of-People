package com.hop.connection.repository;

import com.hop.connection.entity.UserConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserConnectionRepository extends JpaRepository<UserConnection, Long> {

    @Query("SELECT c FROM UserConnection c WHERE " +
           "(c.requester.id = :u1 AND c.receiver.id = :u2) OR " +
           "(c.requester.id = :u2 AND c.receiver.id = :u1)")
    Optional<UserConnection> findConnectionBetween(@Param("u1") Long u1, @Param("u2") Long u2);

    List<UserConnection> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, String status);

    List<UserConnection> findByRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, String status);

    @Query("SELECT c FROM UserConnection c WHERE " +
           "(c.requester.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED' " +
           "ORDER BY c.updatedAt DESC")
    List<UserConnection> findAcceptedConnectionsForUser(@Param("userId") Long userId);

    long countByReceiverIdAndStatus(Long receiverId, String status);
}
