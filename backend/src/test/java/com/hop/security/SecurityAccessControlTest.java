package com.hop.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hop.auth.dto.LoginRequest;
import com.hop.auth.dto.RegisterRequest;
import com.hop.common.enums.RoleType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class SecurityAccessControlTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Unauthenticated request to /api/v1/users/profile returns 401 Unauthorized")
    public void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Request with invalid bearer token returns 401 Unauthorized")
    public void testInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User with ROLE_USER is forbidden (403) from accessing /api/v1/admin/** endpoints")
    public void testRoleUserForbiddenFromAdminEndpoints() throws Exception {
        // Register regular user
        String email = "regularuser@test.org";
        RegisterRequest registerReq = RegisterRequest.builder()
                .email(email)
                .password("UserPass123!")
                .firstName("Regular")
                .lastName("User")
                .role(RoleType.ROLE_USER)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login
        LoginRequest loginReq = LoginRequest.builder()
                .email(email)
                .password("UserPass123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Attempt admin endpoint with ROLE_USER token
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Public endpoints allow anonymous access without token")
    public void testPublicEndpointsAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/assistance/public"))
                .andExpect(status().isOk());

        // Anonymous access reaches domain layer without token (non-existent request produces 404, not 401/403)
        mockMvc.perform(get("/api/v1/donations/request/999"))
                .andExpect(status().isNotFound());
    }
}
