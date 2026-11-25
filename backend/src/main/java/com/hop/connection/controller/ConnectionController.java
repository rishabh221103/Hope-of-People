package com.hop.connection.controller;

import com.hop.common.response.ApiResponse;
import com.hop.connection.dto.ConnectedUserDto;
import com.hop.connection.dto.ConnectionResponse;
import com.hop.connection.dto.ConnectionStatusResponse;
import com.hop.connection.service.ConnectionService;
import com.hop.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request/{targetUserId}")
    public ResponseEntity<ApiResponse<ConnectionStatusResponse>> sendRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long targetUserId) {
        ConnectionStatusResponse response = connectionService.sendConnectionRequest(currentUser.getUsername(), targetUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Connection request sent successfully.", response));
    }

    @RequestMapping(value = "/{id}/accept", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<ConnectionResponse>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        ConnectionResponse response = connectionService.acceptConnectionRequest(currentUser.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Connection request accepted.", response));
    }

    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<ConnectionResponse>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        ConnectionResponse response = connectionService.rejectConnectionRequest(currentUser.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Connection request declined.", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        connectionService.disconnect(currentUser.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Connection removed successfully.", null));
    }

    @GetMapping("/status/{targetUserId}")
    public ResponseEntity<ApiResponse<ConnectionStatusResponse>> getStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long targetUserId) {
        ConnectionStatusResponse response = connectionService.getConnectionStatus(currentUser.getUsername(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Connection status retrieved.", response));
    }

    @GetMapping({"", "/my"})
    public ResponseEntity<ApiResponse<List<ConnectedUserDto>>> getMyConnections(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConnectedUserDto> connections = connectionService.getMyConnections(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Connections retrieved successfully.", connections));
    }

    @GetMapping({"/pending", "/pending/incoming"})
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> getIncomingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConnectionResponse> pending = connectionService.getPendingIncomingRequests(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Incoming connection requests retrieved.", pending));
    }

    @GetMapping({"/sent", "/pending/outgoing"})
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> getOutgoingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConnectionResponse> sent = connectionService.getPendingOutgoingRequests(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Outgoing connection requests retrieved.", sent));
    }

    @GetMapping({"/count", "/pending/count"})
    public ResponseEntity<ApiResponse<Map<String, Long>>> getPendingCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        long count = connectionService.getPendingCount(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Pending count retrieved.", Map.of("count", count, "pendingCount", count)));
    }

    @GetMapping("/discover")
    public ResponseEntity<ApiResponse<List<ConnectedUserDto>>> getDiscoverPeople(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConnectedUserDto> discover = connectionService.getDiscoverPeople(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Discoverable community members retrieved.", discover));
    }
}
