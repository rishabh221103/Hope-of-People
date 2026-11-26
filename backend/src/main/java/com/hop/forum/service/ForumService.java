package com.hop.forum.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.business.entity.BusinessCampaign;
import com.hop.business.repository.BusinessCampaignRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.common.exception.UnauthorizedException;
import com.hop.forum.dto.*;
import com.hop.forum.entity.*;
import com.hop.forum.repository.*;
import com.hop.notification.service.NotificationService;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumCategoryRepository categoryRepository;
    private final ForumPostRepository postRepository;
    private final ForumReplyRepository replyRepository;
    private final ForumPostUpvoteRepository postUpvoteRepository;
    private final UserRepository userRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final BusinessCampaignRepository businessCampaignRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ForumCategoryDto> getCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ForumPostResponse> getPosts(Long categoryId, String search, String sort, String currentUserEmail) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSort = (sort != null) ? sort.toLowerCase().trim() : "newest";

        List<ForumPost> posts;
        if ("popular".equals(cleanSort)) {
            posts = postRepository.findAllFilterOrderByPopular(categoryId, cleanSearch);
        } else if ("unanswered".equals(cleanSort)) {
            posts = postRepository.findAllFilterUnanswered(categoryId, cleanSearch);
        } else {
            posts = postRepository.findAllFilterOrderByNewest(categoryId, cleanSearch);
        }

        Long currentUserId = resolveUserIdByEmail(currentUserEmail);

        return posts.stream()
                .map(post -> mapPostToResponse(post, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public ForumPostResponse getPostById(Long id, String currentUserEmail) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found with ID: " + id));

        // Increment view count
        post.setViewsCount(post.getViewsCount() + 1);
        postRepository.save(post);

        Long currentUserId = resolveUserIdByEmail(currentUserEmail);
        return mapPostToResponse(post, currentUserId);
    }

    @Transactional
    public ForumPostResponse createPost(CreateForumPostRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);

        ForumCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Invalid category ID: " + request.getCategoryId()));

        AssistanceRequest assistance = null;
        if (request.getAssistanceRequestId() != null) {
            assistance = assistanceRequestRepository.findById(request.getAssistanceRequestId()).orElse(null);
        }

        BusinessCampaign campaign = null;
        if (request.getBusinessCampaignId() != null) {
            campaign = businessCampaignRepository.findById(request.getBusinessCampaignId()).orElse(null);
        }

        ForumPost post = ForumPost.builder()
                .user(user)
                .category(category)
                .assistanceRequest(assistance)
                .businessCampaign(campaign)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .tags(request.getTags() != null ? request.getTags().trim() : null)
                .upvotesCount(0)
                .repliesCount(0)
                .viewsCount(0)
                .isPinned(false)
                .isLocked(false)
                .build();

        ForumPost saved = postRepository.save(post);
        log.info("User {} created forum post ID: {}", user.getEmail(), saved.getId());
        return mapPostToResponse(saved, user.getId());
    }

    @Transactional
    public void deletePost(Long id, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found with ID: " + id));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!post.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this forum post");
        }

        postUpvoteRepository.deleteByPostId(id);
        replyRepository.deleteAll(replyRepository.findByPostIdOrderByIsSolutionDescCreatedAtAsc(id));
        postRepository.delete(post);
        log.info("User {} deleted forum post ID: {}", user.getEmail(), id);
    }

    @Transactional(readOnly = true)
    public List<ForumReplyResponse> getReplies(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("Forum post not found with ID: " + postId);
        }

        return replyRepository.findByPostIdOrderByIsSolutionDescCreatedAtAsc(postId).stream()
                .map(this::mapReplyToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ForumReplyResponse createReply(Long postId, CreateForumReplyRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found with ID: " + postId));

        if (Boolean.TRUE.equals(post.getIsLocked())) {
            throw new BadRequestException("This discussion is locked and cannot receive new replies.");
        }

        ForumReply reply = ForumReply.builder()
                .post(post)
                .user(user)
                .content(request.getContent().trim())
                .isSolution(false)
                .upvotesCount(0)
                .build();

        ForumReply saved = replyRepository.save(reply);

        // Update replies count
        post.setRepliesCount(post.getRepliesCount() + 1);
        postRepository.save(post);

        // Notify post author if different user
        if (!post.getUser().getId().equals(user.getId())) {
            String authorName = user.getFirstName() + " " + user.getLastName();
            String snippet = request.getContent().length() > 60
                    ? request.getContent().substring(0, 57) + "..."
                    : request.getContent();

            notificationService.createNotification(
                    post.getUser(),
                    "New Reply to Your Discussion",
                    authorName + " replied: \"" + snippet + "\"",
                    "FORUM_REPLY",
                    postId,
                    "/community/posts/" + postId
            );
        }

        return mapReplyToResponse(saved);
    }

    @Transactional
    public boolean togglePostUpvote(Long postId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found with ID: " + postId));

        Optional<ForumPostUpvote> existing = postUpvoteRepository.findByPostIdAndUserId(postId, user.getId());
        if (existing.isPresent()) {
            postUpvoteRepository.delete(existing.get());
            post.setUpvotesCount(Math.max(0, post.getUpvotesCount() - 1));
            postRepository.save(post);
            return false;
        } else {
            ForumPostUpvote upvote = ForumPostUpvote.builder()
                    .post(post)
                    .user(user)
                    .build();
            postUpvoteRepository.save(upvote);
            post.setUpvotesCount(post.getUpvotesCount() + 1);
            postRepository.save(post);

            // Notify post author if someone else upvoted
            if (!post.getUser().getId().equals(user.getId())) {
                String upvoterName = user.getFirstName() + " " + user.getLastName();
                notificationService.createNotification(
                        post.getUser(),
                        "Discussion Upvoted",
                        upvoterName + " upvoted your discussion: \"" + post.getTitle() + "\"",
                        "FORUM_UPVOTE",
                        postId,
                        "/community/posts/" + postId
                );
            }
            return true;
        }
    }

    @Transactional
    public ForumReplyResponse toggleSolution(Long replyId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        ForumReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum reply not found with ID: " + replyId));

        ForumPost post = reply.getPost();
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!post.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new UnauthorizedException("Only the discussion author or an admin can mark accepted solutions.");
        }

        boolean newStatus = !Boolean.TRUE.equals(reply.getIsSolution());
        reply.setIsSolution(newStatus);
        ForumReply updated = replyRepository.save(reply);

        if (newStatus && !reply.getUser().getId().equals(user.getId())) {
            notificationService.createNotification(
                    reply.getUser(),
                    "Accepted Solution",
                    "Your answer on \"" + post.getTitle() + "\" was marked as the accepted solution!",
                    "FORUM_SOLUTION",
                    post.getId(),
                    "/community/posts/" + post.getId()
            );
        }

        return mapReplyToResponse(updated);
    }

    @Transactional
    public void deleteReply(Long replyId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        ForumReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum reply not found with ID: " + replyId));

        ForumPost post = reply.getPost();
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!reply.getUser().getId().equals(user.getId()) && !post.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this reply");
        }

        post.setRepliesCount(Math.max(0, post.getRepliesCount() - 1));
        postRepository.save(post);
        replyRepository.delete(reply);
        log.info("User {} deleted forum reply ID: {}", user.getEmail(), replyId);
    }

    // --- Helpers & Mappers ---

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Long resolveUserIdByEmail(String email) {
        if (email == null) return null;
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    private ForumCategoryDto mapCategoryToDto(ForumCategory cat) {
        return ForumCategoryDto.builder()
                .id(cat.getId())
                .name(cat.getName())
                .slug(cat.getSlug())
                .description(cat.getDescription())
                .iconName(cat.getIconName())
                .displayOrder(cat.getDisplayOrder())
                .build();
    }

    private ForumPostResponse mapPostToResponse(ForumPost post, Long currentUserId) {
        boolean isUpvoted = false;
        if (currentUserId != null) {
            isUpvoted = postUpvoteRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        }

        boolean hasSolution = replyRepository.findByPostIdOrderByIsSolutionDescCreatedAtAsc(post.getId())
                .stream().anyMatch(r -> Boolean.TRUE.equals(r.getIsSolution()));

        String authorRole = "MEMBER";
        if (post.getUser().getRoles() != null && !post.getUser().getRoles().isEmpty()) {
            authorRole = post.getUser().getRoles().iterator().next().getName().replace("ROLE_", "");
        }

        ForumPostResponse.ForumPostResponseBuilder builder = ForumPostResponse.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .authorName(post.getUser().getFirstName() + " " + post.getUser().getLastName())
                .authorEmail(post.getUser().getEmail())
                .authorCity(post.getUser().getCity())
                .authorRole(authorRole)
                .categoryId(post.getCategory().getId())
                .categoryName(post.getCategory().getName())
                .categorySlug(post.getCategory().getSlug())
                .categoryIcon(post.getCategory().getIconName())
                .title(post.getTitle())
                .content(post.getContent())
                .tags(post.getTags())
                .upvotesCount(post.getUpvotesCount())
                .repliesCount(post.getRepliesCount())
                .viewsCount(post.getViewsCount())
                .isPinned(post.getIsPinned())
                .isLocked(post.getIsLocked())
                .isUpvotedByCurrentUser(isUpvoted)
                .hasAcceptedSolution(hasSolution)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt());

        if (post.getAssistanceRequest() != null) {
            builder.assistanceRequestId(post.getAssistanceRequest().getId())
                    .assistanceRequestTitle(post.getAssistanceRequest().getTitle())
                    .assistanceCategory(post.getAssistanceRequest().getCategory())
                    .assistanceTargetAmount(post.getAssistanceRequest().getTargetAmount() != null
                            ? post.getAssistanceRequest().getTargetAmount().toString() : null)
                    .assistanceRaisedAmount(post.getAssistanceRequest().getRaisedAmount() != null
                            ? post.getAssistanceRequest().getRaisedAmount().toString() : "0.00");
        }

        if (post.getBusinessCampaign() != null) {
            builder.businessCampaignId(post.getBusinessCampaign().getId())
                    .businessName(post.getBusinessCampaign().getBusinessName())
                    .businessTargetAmount(post.getBusinessCampaign().getTargetAmount() != null
                            ? post.getBusinessCampaign().getTargetAmount().toString() : null)
                    .businessRaisedAmount(post.getBusinessCampaign().getRaisedAmount() != null
                            ? post.getBusinessCampaign().getRaisedAmount().toString() : "0.00");
        }

        return builder.build();
    }

    private ForumReplyResponse mapReplyToResponse(ForumReply reply) {
        String role = "MEMBER";
        if (reply.getUser().getRoles() != null && !reply.getUser().getRoles().isEmpty()) {
            role = reply.getUser().getRoles().iterator().next().getName().replace("ROLE_", "");
        }

        return ForumReplyResponse.builder()
                .id(reply.getId())
                .postId(reply.getPost().getId())
                .userId(reply.getUser().getId())
                .authorName(reply.getUser().getFirstName() + " " + reply.getUser().getLastName())
                .authorEmail(reply.getUser().getEmail())
                .authorRole(role)
                .content(reply.getContent())
                .isSolution(reply.getIsSolution())
                .upvotesCount(reply.getUpvotesCount())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .build();
    }
}
