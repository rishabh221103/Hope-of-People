package com.hop.search.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.business.entity.BusinessCampaign;
import com.hop.business.repository.BusinessCampaignRepository;
import com.hop.forum.entity.ForumPost;
import com.hop.forum.repository.ForumPostRepository;
import com.hop.podcast.entity.Podcast;
import com.hop.podcast.repository.PodcastRepository;
import com.hop.reel.entity.Reel;
import com.hop.reel.entity.ReelStatus;
import com.hop.reel.repository.ReelRepository;
import com.hop.search.dto.GlobalSearchResponse;
import com.hop.search.dto.SearchResultItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchService {

    private final AssistanceRequestRepository assistanceRequestRepository;
    private final ReelRepository reelRepository;
    private final PodcastRepository podcastRepository;
    private final ForumPostRepository forumPostRepository;
    private final BusinessCampaignRepository businessCampaignRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String query, String typeFilter, int limit) {
        String cleanQuery = (query != null) ? query.trim() : "";
        if (cleanQuery.isBlank()) {
            return GlobalSearchResponse.builder()
                    .query("")
                    .totalCount(0)
                    .causes(Collections.emptyList())
                    .reels(Collections.emptyList())
                    .podcasts(Collections.emptyList())
                    .forumPosts(Collections.emptyList())
                    .businesses(Collections.emptyList())
                    .allResults(Collections.emptyList())
                    .build();
        }

        int effectiveLimit = Math.max(1, Math.min(limit, 50));
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        boolean matchAll = (typeFilter == null || typeFilter.isBlank() || "all".equalsIgnoreCase(typeFilter));

        List<SearchResultItem> causes = new ArrayList<>();
        List<SearchResultItem> reels = new ArrayList<>();
        List<SearchResultItem> podcasts = new ArrayList<>();
        List<SearchResultItem> forumPosts = new ArrayList<>();
        List<SearchResultItem> businesses = new ArrayList<>();

        if (matchAll || "cause".equalsIgnoreCase(typeFilter) || "causes".equalsIgnoreCase(typeFilter)) {
            List<AssistanceRequest> requests = assistanceRequestRepository.searchRequests(
                    List.of("APPROVED", "FULFILLED"), cleanQuery, pageable);
            causes = requests.stream().map(this::mapCause).collect(Collectors.toList());
        }

        if (matchAll || "reel".equalsIgnoreCase(typeFilter) || "reels".equalsIgnoreCase(typeFilter)) {
            List<Reel> liveReels = reelRepository.searchLiveReels(ReelStatus.LIVE, cleanQuery, pageable);
            reels = liveReels.stream().map(this::mapReel).collect(Collectors.toList());
        }

        if (matchAll || "podcast".equalsIgnoreCase(typeFilter) || "podcasts".equalsIgnoreCase(typeFilter)) {
            List<Podcast> podcastList = podcastRepository.findAllFilterOrderByNewest(null, "%" + cleanQuery.toLowerCase() + "%");
            if (podcastList.size() > effectiveLimit) {
                podcastList = podcastList.subList(0, effectiveLimit);
            }
            podcasts = podcastList.stream().map(this::mapPodcast).collect(Collectors.toList());
        }

        if (matchAll || "forum".equalsIgnoreCase(typeFilter) || "community".equalsIgnoreCase(typeFilter)) {
            List<ForumPost> postList = forumPostRepository.findAllFilterOrderByNewest(null, cleanQuery);
            if (postList.size() > effectiveLimit) {
                postList = postList.subList(0, effectiveLimit);
            }
            forumPosts = postList.stream().map(this::mapForumPost).collect(Collectors.toList());
        }

        if (matchAll || "business".equalsIgnoreCase(typeFilter) || "businesses".equalsIgnoreCase(typeFilter)) {
            List<BusinessCampaign> campaignList = businessCampaignRepository.searchCampaigns("ACTIVE", cleanQuery, pageable);
            businesses = campaignList.stream().map(this::mapBusiness).collect(Collectors.toList());
        }

        List<SearchResultItem> all = new ArrayList<>();
        all.addAll(causes);
        all.addAll(reels);
        all.addAll(podcasts);
        all.addAll(forumPosts);
        all.addAll(businesses);

        // Sort all aggregated results by creation date if present
        all.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        int total = causes.size() + reels.size() + podcasts.size() + forumPosts.size() + businesses.size();

        return GlobalSearchResponse.builder()
                .query(cleanQuery)
                .totalCount(total)
                .causes(causes)
                .reels(reels)
                .podcasts(podcasts)
                .forumPosts(forumPosts)
                .businesses(businesses)
                .allResults(all)
                .build();
    }

    @Transactional(readOnly = true)
    public GlobalSearchResponse quickSearch(String query) {
        return search(query, "all", 3);
    }

    private SearchResultItem mapCause(AssistanceRequest a) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("targetAmount", a.getTargetAmount());
        extra.put("raisedAmount", a.getRaisedAmount());
        extra.put("status", a.getStatus());
        extra.put("city", a.getCity());

        String author = Boolean.TRUE.equals(a.getIsAnonymous()) ? "Anonymous Beneficiary" :
                (a.getUser() != null ? a.getUser().getFullName() : "Beneficiary");

        return SearchResultItem.builder()
                .id(a.getId())
                .type("CAUSE")
                .title(a.getTitle())
                .description(a.getDescription())
                .category(a.getCategory())
                .url("/causes/" + a.getId())
                .thumbnailUrl(null)
                .authorName(author)
                .createdAt(a.getCreatedAt())
                .extra(extra)
                .build();
    }

    private SearchResultItem mapReel(Reel r) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("likesCount", r.getLikesCount());
        extra.put("commentCount", r.getCommentCount());
        extra.put("viewsCount", r.getViewsCount());
        extra.put("videoUrl", r.getVideoUrl());

        String author = r.getUser() != null ? r.getUser().getFullName() : "Creator";

        return SearchResultItem.builder()
                .id(r.getId())
                .type("REEL")
                .title(r.getCaption())
                .description(r.getSourceLocation() != null ? "Location: " + r.getSourceLocation() : "Impact Video")
                .category(r.getCategory())
                .url("/reels?id=" + r.getId())
                .thumbnailUrl(r.getThumbnailUrl())
                .authorName(author)
                .createdAt(r.getCreatedAt())
                .extra(extra)
                .build();
    }

    private SearchResultItem mapPodcast(Podcast p) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("playsCount", p.getPlaysCount());
        extra.put("durationSeconds", p.getDurationSeconds());
        extra.put("audioUrl", p.getAudioUrl());

        String author = p.getHostName() != null && !p.getHostName().isBlank() ? p.getHostName() :
                (p.getUser() != null ? p.getUser().getFullName() : "Host");

        return SearchResultItem.builder()
                .id(p.getId())
                .type("PODCAST")
                .title(p.getTitle())
                .description(p.getDescription())
                .category(p.getCategory())
                .url("/podcasts?id=" + p.getId())
                .thumbnailUrl(p.getCoverImageUrl())
                .authorName(author)
                .createdAt(p.getPublishedAt() != null ? p.getPublishedAt() : p.getCreatedAt())
                .extra(extra)
                .build();
    }

    private SearchResultItem mapForumPost(ForumPost f) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("upvotesCount", f.getUpvotesCount());
        extra.put("repliesCount", f.getRepliesCount());

        String desc = f.getContent();
        if (desc != null && desc.length() > 140) {
            desc = desc.substring(0, 140) + "...";
        }

        String author = f.getUser() != null ? f.getUser().getFullName() : "Community Member";
        String catName = f.getCategory() != null ? f.getCategory().getName() : "General";

        return SearchResultItem.builder()
                .id(f.getId())
                .type("FORUM_POST")
                .title(f.getTitle())
                .description(desc)
                .category(catName)
                .url("/community?post=" + f.getId())
                .thumbnailUrl(null)
                .authorName(author)
                .createdAt(f.getCreatedAt())
                .extra(extra)
                .build();
    }

    private SearchResultItem mapBusiness(BusinessCampaign b) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("targetAmount", b.getTargetAmount());
        extra.put("raisedAmount", b.getRaisedAmount());
        extra.put("location", b.getLocation());

        String author = b.getUser() != null ? b.getUser().getFullName() : "Founder";

        return SearchResultItem.builder()
                .id(b.getId())
                .type("BUSINESS")
                .title(b.getBusinessName())
                .description(b.getDescription())
                .category(b.getIndustry())
                .url("/business-hub?id=" + b.getId())
                .thumbnailUrl(null)
                .authorName(author)
                .createdAt(b.getCreatedAt())
                .extra(extra)
                .build();
    }
}
