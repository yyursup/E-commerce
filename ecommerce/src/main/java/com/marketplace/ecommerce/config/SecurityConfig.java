package com.marketplace.ecommerce.config;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final AccountRepository userRepository;
    private final JwtFilter jwtFilter;

    // ========================================================================
    // CORS CONFIGURATION (must be a bean to be referenced by other chains)
    // ========================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Restrict to known frontend origins in production
        // For development, use environment-specific values
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ========================================================================
    // CORE BEANS
    // ========================================================================
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ========================================================================
    // WEBSOCKET SECURITY (Order 0 - Highest Priority)
    // WebSocket endpoints use token in query parameter, handled by LiveKit
    // ========================================================================
    @Bean
    @Order(0)
    public SecurityFilterChain webSocketSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                "/api/v1/ws/chat", "/api/v1/ws/chat/**",
                "/api/v1/ws-chat", "/api/v1/ws-chat/**",
                "/ws/chat", "/ws/chat/**"
            )
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    // ========================================================================
    // CHAT API SECURITY (Order 1)
    // Chat endpoints permit unauthenticated access (JWT validated in filter)
    // ========================================================================
    @Bean
    @Order(1)
    public SecurityFilterChain chatSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/v1/chat/**")
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ========================================================================
    // MAIN API SECURITY (Order 2 - Default)
    // 
    // IMPORTANT: This configuration defines PUBLIC endpoints.
    // All other endpoints require authentication and should use @PreAuthorize
    // for role-based access control (e.g., @PreAuthorize("hasRole('ADMIN')"))
    // ========================================================================
    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // =================================================================
                // STATIC RESOURCES - Always public
                // =================================================================
                .requestMatchers("/error", "/favicon.ico", "/static/**", "/uploads/**").permitAll()

                // =================================================================
                // AUTHENTICATION ENDPOINTS - Always public
                // =================================================================
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/verify").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/forgot-password/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/forgot-password/reset").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh-token").permitAll()
                .requestMatchers("/api/v1/auth/oauth2/**").permitAll()

                // =================================================================
                // PUBLIC PRODUCT ENDPOINTS - Anyone can browse
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/product").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/product/**").permitAll()
                
                // =================================================================
                // PUBLIC CATEGORY ENDPOINTS - Anyone can browse
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/category").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/category/**").permitAll()
                
                // =================================================================
                // PUBLIC SHOP ENDPOINTS - Anyone can view shops
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/shop").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/shop/**").permitAll()
                
                // =================================================================
                // PUBLIC REVIEW ENDPOINTS - Anyone can view reviews
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/review/products/**").permitAll()
                
                // =================================================================
                // PUBLIC SOCIAL ENDPOINTS - Anyone can view follow status
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/social/shop/follow-status/**").permitAll()
                
                // =================================================================
                // PUBLIC WISHLIST CHECK - Anyone can check wishlist status
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/wishlist/status/**").permitAll()
                
                // =================================================================
                // PUBLIC LIVESTREAM ENDPOINTS - Anyone can view livestreams
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/livestreams/active").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/livestreams").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/livestreams/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/livestreams/*/join").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/livestreams/*/like").permitAll()
                
                // =================================================================
                // PUBLIC VOUCHER ENDPOINTS - Anyone can view vouchers
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/vouchers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/vouchers/**").permitAll()
                
                // =================================================================
                // PUBLIC STATISTICS ENDPOINTS - Anyone can view platform stats
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/statistics/platform").permitAll()
                
                // =================================================================
                // THIRD-PARTY WEBHOOKS - External systems only
                // =================================================================
                .requestMatchers("/payments/vnpay/callback").permitAll()
                .requestMatchers("/api/v1/webhook/ghn/**").permitAll()
                
                // =================================================================
                // FILE UPLOADS - Public read access
                // =================================================================
                .requestMatchers(HttpMethod.GET, "/api/v1/file/**").permitAll()
                
                // =================================================================
                // SWAGGER / OPENAPI - Public documentation
                // =================================================================
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                
                // =================================================================
                // ACTUATOR HEALTH - For monitoring
                // =================================================================
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                
                // =================================================================
                // DEFAULT: All other requests require authentication
                // Use @PreAuthorize in controllers for role-based access
                // Example: @PreAuthorize("hasRole('ADMIN')") for admin-only endpoints
                // =================================================================
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
