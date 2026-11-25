package com.hop.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hop.auth.dto.LoginRequest;
import com.hop.auth.dto.RegisterRequest;
import com.hop.assistance.dto.CreateAssistanceRequest;
import com.hop.common.enums.PriorityLevel;
import com.hop.common.enums.RoleType;
import com.hop.donation.dto.CreateDonationRequest;
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

import java.math.BigDecimal;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class ValidationAndBusinessLogicTest {

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
    @DisplayName("Registration with invalid email format returns 400 Bad Request")
    public void testInvalidEmailRegistration() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .email("not-a-valid-email")
                .password("ValidPass123!")
                .firstName("Test")
                .lastName("User")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Registration with short password (< 6 chars) returns 400 Bad Request")
    public void testShortPasswordRegistration() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .email("shortpass@test.org")
                .password("123")
                .firstName("Test")
                .lastName("User")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Duplicate email registration returns 400 Bad Request")
    public void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .email("unique@test.org")
                .password("ValidPass123!")
                .firstName("Unique")
                .lastName("User")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Duplicate
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Assistance request with non-positive target amount returns 400 Bad Request")
    public void testNegativeOrZeroTargetAmountAssistance() throws Exception {
        // Register and login user
        String email = "applicant@test.org";
        RegisterRequest reg = RegisterRequest.builder()
                .email(email)
                .password("ValidPass123!")
                .firstName("App")
                .lastName("Licant")
                .role(RoleType.ROLE_USER)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder()
                                .email(email)
                                .password("ValidPass123!")
                                .build())))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Submit with zero target amount
        CreateAssistanceRequest badReq = CreateAssistanceRequest.builder()
                .title("Valid Title")
                .description("Valid description")
                .category("FOOD")
                .targetAmount(BigDecimal.ZERO)
                .priority(PriorityLevel.LOW)
                .build();

        mockMvc.perform(post("/api/v1/assistance")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Donation request with amount less than 1.00 returns 400 Bad Request")
    public void testInvalidDonationAmount() throws Exception {
        // Register and login donor
        String email = "microdonor@test.org";
        RegisterRequest reg = RegisterRequest.builder()
                .email(email)
                .password("ValidPass123!")
                .firstName("Micro")
                .lastName("Donor")
                .role(RoleType.ROLE_DONOR)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder()
                                .email(email)
                                .password("ValidPass123!")
                                .build())))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Submit donation with 0.50 (minimum is 1.00)
        CreateDonationRequest donation = CreateDonationRequest.builder()
                .requestId(1L)
                .amount(BigDecimal.valueOf(0.50))
                .paymentMethod("CREDIT_CARD")
                .build();

        mockMvc.perform(post("/api/v1/donations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donation)))
                .andExpect(status().isBadRequest());
    }
}
