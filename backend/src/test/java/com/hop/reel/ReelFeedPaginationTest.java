package com.hop.reel;

import com.hop.auth.dto.RegisterRequest;
import com.hop.auth.service.AuthService;
import com.hop.common.enums.RoleType;
import com.hop.reel.entity.Reel;
import com.hop.reel.entity.ReelStatus;
import com.hop.reel.repository.ReelRepository;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ReelFeedPaginationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ReelRepository reelRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;
    private User testUser;
    private String userToken;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        reelRepository.deleteAll();

        // Create test user
        String email = "reel_tester_" + System.currentTimeMillis() + "@example.com";
        RegisterRequest register = new RegisterRequest();
        register.setEmail(email);
        register.setPassword("Password123!");
        register.setFirstName("Reel");
        register.setLastName("Tester");
        register.setRole(RoleType.ROLE_USER);

        var authResponse = authService.register(register);
        userToken = authResponse.getToken();
        testUser = userRepository.findByEmail(email).orElseThrow();
    }

    @Test
    @DisplayName("Feed keyset pagination returns no duplicates, no gaps, and excludes non-LIVE reels")
    public void testFeedKeysetPagination() throws Exception {
        // Seed 25 LIVE reels and 3 PENDING_REVIEW reels
        List<Reel> seeded = new ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            Reel reel = Reel.builder()
                    .user(testUser)
                    .storageProvider("local")
                    .storageKey("test_video_" + i + ".mp4")
                    .mimeType("video/mp4")
                    .sizeBytes(1024L * 1024L)
                    .caption("Live Reel #" + i)
                    .category("GENERAL")
                    .durationSec(30)
                    .status(ReelStatus.LIVE)
                    .consentGiven(true)
                    .viewsCount(0L)
                    .likesCount(0)
                    .commentCount(0)
                    .sharesCount(0)
                    .build();
            seeded.add(reel);
        }
        reelRepository.saveAll(seeded);

        // Seed 3 PENDING_REVIEW reels
        for (int i = 1; i <= 3; i++) {
            Reel pending = Reel.builder()
                    .user(testUser)
                    .storageProvider("local")
                    .storageKey("pending_video_" + i + ".mp4")
                    .caption("Pending Reel #" + i)
                    .category("GENERAL")
                    .status(ReelStatus.PENDING_REVIEW)
                    .consentGiven(true)
                    .build();
            reelRepository.save(pending);
        }

        Set<Long> collectedIds = new HashSet<>();

        // Page 1: limit = 10
        MvcResult page1Result = mockMvc.perform(get("/api/v1/reels/feed?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(10)))
                .andExpect(jsonPath("$.data.hasMore", is(true)))
                .andExpect(jsonPath("$.data.nextCursor", notNullValue()))
                .andReturn();

        String page1Json = page1Result.getResponse().getContentAsString();
        String nextCursor1 = extractJsonValue(page1Json, "nextCursor");
        List<Long> ids1 = extractIdsFromJson(page1Json);
        collectedIds.addAll(ids1);
        assertEquals(10, ids1.size());

        // Page 2: with cursor
        MvcResult page2Result = mockMvc.perform(get("/api/v1/reels/feed?limit=10&cursor=" + nextCursor1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(10)))
                .andExpect(jsonPath("$.data.hasMore", is(true)))
                .andExpect(jsonPath("$.data.nextCursor", notNullValue()))
                .andReturn();

        String page2Json = page2Result.getResponse().getContentAsString();
        String nextCursor2 = extractJsonValue(page2Json, "nextCursor");
        List<Long> ids2 = extractIdsFromJson(page2Json);
        for (Long id : ids2) {
            assertFalse(collectedIds.contains(id), "Duplicate reel found across pagination: " + id);
            collectedIds.add(id);
        }
        assertEquals(10, ids2.size());

        // Page 3: remaining items
        MvcResult page3Result = mockMvc.perform(get("/api/v1/reels/feed?limit=10&cursor=" + nextCursor2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(5)))
                .andExpect(jsonPath("$.data.hasMore", is(false)))
                .andExpect(jsonPath("$.data.nextCursor", nullValue()))
                .andReturn();

        List<Long> ids3 = extractIdsFromJson(page3Result.getResponse().getContentAsString());
        for (Long id : ids3) {
            assertFalse(collectedIds.contains(id), "Duplicate reel found in page 3: " + id);
            collectedIds.add(id);
        }
        assertEquals(5, ids3.size());

        assertEquals(25, collectedIds.size(), "All 25 LIVE reels were fetched with 0 duplicates and 0 gaps");
    }

    @Test
    @DisplayName("Feed limit is capped at 20 even if client requests higher")
    public void testFeedLimitCapped() throws Exception {
        for (int i = 1; i <= 25; i++) {
            Reel reel = Reel.builder()
                    .user(testUser)
                    .storageProvider("local")
                    .storageKey("cap_test_" + i + ".mp4")
                    .caption("Capped #" + i)
                    .status(ReelStatus.LIVE)
                    .consentGiven(true)
                    .build();
            reelRepository.save(reel);
        }

        mockMvc.perform(get("/api/v1/reels/feed?limit=50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(20)));
    }

    @Test
    @DisplayName("Upload rejects when consentGiven is missing or false")
    public void testUploadRejectsMissingConsent() throws Exception {
        byte[] dummyMp4 = new byte[]{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32};
        MockMultipartFile file = new MockMultipartFile("file", "test.mp4", "video/mp4", dummyMp4);

        mockMvc.perform(multipart("/api/v1/reels")
                        .file(file)
                        .param("caption", "Test Video")
                        .param("consentGiven", "false")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("consent")));
    }

    @Test
    @DisplayName("Non-admin user cannot approve reels")
    public void testNonAdminCannotApproveReel() throws Exception {
        Reel reel = Reel.builder()
                .user(testUser)
                .storageProvider("local")
                .storageKey("approval_test.mp4")
                .caption("To Approve")
                .status(ReelStatus.PENDING_REVIEW)
                .consentGiven(true)
                .build();
        Reel saved = reelRepository.save(reel);

        mockMvc.perform(patch("/api/v1/admin/reels/" + saved.getId() + "/approve")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    private String extractJsonValue(String json, String field) {
        String pattern = "\"" + field + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private List<Long> extractIdsFromJson(String json) throws Exception {
        List<Long> ids = new ArrayList<>();
        com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(json);
        com.fasterxml.jackson.databind.JsonNode items = root.path("data").path("items");
        if (items.isArray()) {
            for (com.fasterxml.jackson.databind.JsonNode item : items) {
                ids.add(item.path("id").asLong());
            }
        }
        return ids;
    }
}
