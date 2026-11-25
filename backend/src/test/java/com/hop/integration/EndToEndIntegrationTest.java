package com.hop.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hop.auth.dto.LoginRequest;
import com.hop.auth.dto.RegisterRequest;
import com.hop.assistance.dto.CreateAssistanceRequest;
import com.hop.common.enums.PriorityLevel;
import com.hop.common.enums.RoleType;
import com.hop.donation.dto.CreateDonationRequest;
import com.hop.user.dto.UpdateProfileRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.junit.jupiter.api.BeforeEach;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class EndToEndIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @Order(1)
    @DisplayName("Complete E2E Lifecycle: Register -> Apply -> Admin Review -> Donate -> Fulfill")
    public void testCompleteEndToEndJourney() throws Exception {
        // ==========================================
        // 1. Beneficiary Registration & Login
        // ==========================================
        RegisterRequest beneficiaryRegister = RegisterRequest.builder()
                .email("beneficiary@example.com")
                .password("Password123!")
                .firstName("Alice")
                .lastName("Smith")
                .phone("+1555123456")
                .role(RoleType.ROLE_USER)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(beneficiaryRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("beneficiary@example.com"));

        LoginRequest beneficiaryLogin = LoginRequest.builder()
                .email("beneficiary@example.com")
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(beneficiaryLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();

        JsonNode loginNode = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String beneficiaryToken = loginNode.path("data").path("token").asText();
        assertThat(beneficiaryToken).isNotBlank();

        // ==========================================
        // 2. Beneficiary Profile Inspection & Update
        // ==========================================
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + beneficiaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("Alice"))
                .andExpect(jsonPath("$.data.lastName").value("Smith"));

        UpdateProfileRequest updateProfile = UpdateProfileRequest.builder()
                .firstName("Alice")
                .lastName("Johnson")
                .phone("+1555987654")
                .build();

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + beneficiaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateProfile)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastName").value("Johnson"));

        // ==========================================
        // 3. Submit Assistance Request
        // ==========================================
        CreateAssistanceRequest createReq = CreateAssistanceRequest.builder()
                .title("Urgent Medical Bill Assistance")
                .description("Hospital expense assistance needed for sudden injury rehabilitation.")
                .category("MEDICAL")
                .targetAmount(BigDecimal.valueOf(500.00))
                .priority(PriorityLevel.HIGH)
                .build();

        MvcResult requestResult = mockMvc.perform(post("/api/v1/assistance")
                        .header("Authorization", "Bearer " + beneficiaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Urgent Medical Bill Assistance"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        JsonNode reqNode = objectMapper.readTree(requestResult.getResponse().getContentAsString());
        long requestId = reqNode.path("data").path("id").asLong();
        assertThat(requestId).isPositive();

        // Verify My Requests
        mockMvc.perform(get("/api/v1/assistance/my-requests")
                        .header("Authorization", "Bearer " + beneficiaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(requestId));

        // ==========================================
        // 4. Admin Registration, Login & Moderation
        // ==========================================
        RegisterRequest adminRegister = RegisterRequest.builder()
                .email("admin@hop.internal")
                .password("AdminSecurePass123!")
                .firstName("Super")
                .lastName("Admin")
                .role(RoleType.ROLE_ADMIN)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRegister)))
                .andExpect(status().isCreated());

        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@hop.internal")
                .password("AdminSecurePass123!")
                .build();

        MvcResult adminLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Admin Review Queue
        mockMvc.perform(get("/api/v1/admin/assistance")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Admin Approves the Assistance Request
        mockMvc.perform(patch("/api/v1/admin/assistance/" + requestId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"APPROVE\",\"remarks\":\"All medical documentation verified.\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // Public Can Now Browse the Approved Request
        mockMvc.perform(get("/api/v1/assistance/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(requestId));

        // ==========================================
        // 5. Donor Registration, Login & Donation
        // ==========================================
        RegisterRequest donorRegister = RegisterRequest.builder()
                .email("donor@example.com")
                .password("DonorPass123!")
                .firstName("Robert")
                .lastName("Donor")
                .role(RoleType.ROLE_DONOR)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorRegister)))
                .andExpect(status().isCreated());

        LoginRequest donorLogin = LoginRequest.builder()
                .email("donor@example.com")
                .password("DonorPass123!")
                .build();

        MvcResult donorLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String donorToken = objectMapper.readTree(donorLoginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Process Donation for 500.00 (Reaching the Target Amount)
        CreateDonationRequest donationRequest = CreateDonationRequest.builder()
                .requestId(requestId)
                .amount(BigDecimal.valueOf(500.00))
                .paymentMethod("CREDIT_CARD")
                .build();

        mockMvc.perform(post("/api/v1/donations")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donationRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.amount").value(500.0))
                .andExpect(jsonPath("$.data.transactionRef").exists());

        // Donor Contribution History
        mockMvc.perform(get("/api/v1/donations/my-donations")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].amount").value(500.0));

        // Public Donation Ledger
        mockMvc.perform(get("/api/v1/donations/request/" + requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].amount").value(500.0));

        // ==========================================
        // 6. Verify Automatic Status Progression
        // ==========================================
        mockMvc.perform(get("/api/v1/assistance/" + requestId)
                        .header("Authorization", "Bearer " + beneficiaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FULFILLED"))
                .andExpect(jsonPath("$.data.raisedAmount").value(500.0));

        // ==========================================
        // 7. Verify Admin System Metrics
        // ==========================================
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").value(3))
                .andExpect(jsonPath("$.data.fulfilledRequests").value(1))
                .andExpect(jsonPath("$.data.totalRaisedAmount").value(500.0));
    }
}
