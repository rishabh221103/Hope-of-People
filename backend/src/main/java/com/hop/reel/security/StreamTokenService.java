package com.hop.reel.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Generates and validates short-lived cryptographic signed tokens for HTML5 <video> streaming.
 * Overcomes the restriction that native <video> elements cannot transmit HTTP Authorization headers.
 */
@Slf4j
@Service
public class StreamTokenService {

    private final SecretKey key;
    private static final long STREAM_TOKEN_VALIDITY_MS = 3600_000L; // 1 hour

    public StreamTokenService(@Value("${app.jwt.secret}") String jwtSecret) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateStreamToken(Long reelId, Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + STREAM_TOKEN_VALIDITY_MS);

        return Jwts.builder()
                .subject(userId != null ? userId.toString() : "anonymous")
                .claim("reelId", reelId)
                .claim("purpose", "STREAM")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public boolean validateStreamToken(String token, Long reelId) {
        if (token == null || token.isBlank()) return false;
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Object tokenReelId = claims.get("reelId");
            String purpose = claims.get("purpose", String.class);

            if (!"STREAM".equals(purpose)) return false;
            if (tokenReelId == null) return false;

            Long parsedId = tokenReelId instanceof Number num ? num.longValue() : Long.parseLong(tokenReelId.toString());
            return parsedId.equals(reelId);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid streaming token for reel {}: {}", reelId, e.getMessage());
            return false;
        }
    }
}
