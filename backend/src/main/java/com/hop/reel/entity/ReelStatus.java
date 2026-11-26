package com.hop.reel.entity;

/**
 * Lifecycle status of a short-video reel.
 * All reels start as PENDING_REVIEW and must be approved by an Admin to go LIVE.
 */
public enum ReelStatus {
    UPLOADING,
    PROCESSING,
    PENDING_REVIEW,
    LIVE,
    REJECTED
}
