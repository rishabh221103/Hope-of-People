package com.hop.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/v1/assistance/public",
                                "/api/v1/assistance/nearby",
                                "/api/v1/stories/active",
                                "/api/v1/business-hub/campaigns",
                                "/api/v1/business-hub/campaigns/*",
                                "/api/v1/documents/download/**",
                                "/api/v1/documents/request/**",
                                "/api/v1/donations/request/**",
                                "/api/v1/reels/video/**",
                                "/api/v1/reels/*/stream",
                                "/api/reels/*/stream",
                                "/api/v1/podcasts/audio/**",
                                "/api/v1/search/**",
                                "/error",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/v1/reels", "/api/v1/reels/*", "/api/v1/reels/user/*", "/api/v1/reels/feed", "/api/v1/reels/*/comments",
                                "/api/reels", "/api/reels/*", "/api/reels/feed", "/api/reels/*/comments"
                        ).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/forum/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/podcasts", "/api/v1/podcasts/*").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/reels/*/view", "/api/reels/*/view").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/podcasts/*/play").permitAll()
                        .requestMatchers("/api/v1/admin/**", "/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
