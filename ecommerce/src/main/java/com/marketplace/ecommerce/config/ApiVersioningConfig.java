package com.marketplace.ecommerce.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class ApiVersioningConfig implements WebMvcConfigurer {

    // Matches /api/v1, /api/v1/..., /api/v2/...
    private static final Pattern API_VERSION_PATTERN = Pattern.compile("^/api/v([0-9]+(?:\\.[0-9]+)*)(?:/.*)?$");

    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer.setVersionRequired(false);
        configurer.setDefaultVersion("1");
        configurer.addSupportedVersions("1");
        configurer.useVersionResolver(request -> {
            String uri = request.getRequestURI();
            if (uri != null) {
                String contextPath = request.getContextPath();
                if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
                    uri = uri.substring(contextPath.length());
                }
                Matcher matcher = API_VERSION_PATTERN.matcher(uri);
                if (matcher.find()) {
                    return matcher.group(1);
                }
            }
            // Non-versioned endpoints (e.g. /ws/chat, /payments/**, /error) -> return null so versioning check passes
            return null;
        });
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix("/api/v{version}",
                HandlerTypePredicate.forAnnotation(RestController.class));
    }
}
