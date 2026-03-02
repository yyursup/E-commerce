package com.marketplace.ecommerce.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Load file .env từ thư mục gốc dự án và set vào System properties
 * để Spring Boot đọc được qua ${VAR} trong application.properties.
 * Cần gọi loadDotEnv() trong main() trước SpringApplication.run().
 */
public final class DotEnvConfig {

    private static final Logger logger = LoggerFactory.getLogger(DotEnvConfig.class);
    private static final String ENV_FILE = ".env";

    private DotEnvConfig() {
    }

    /**
     * Load file .env và set vào System properties. Gọi từ main() trước SpringApplication.run().
     */
    public static void loadDotEnv() {
        try {
            Path projectRoot = findProjectRoot();
            Path envFilePath = projectRoot.resolve(ENV_FILE);

            if (!Files.exists(envFilePath)) {
                logger.warn("File .env not found at: {}. Using system environment variables.", envFilePath.toAbsolutePath());
                return;
            }

            logger.info("Loading .env from: {}", envFilePath.toAbsolutePath());
            Map<String, String> envVars = parseEnvFile(envFilePath.toFile());

            for (Map.Entry<String, String> entry : envVars.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                    logger.debug("Loaded: {} = {}", key, maskSensitive(key, value));
                }
            }

            logger.info("Loaded {} variables from .env", envVars.size());
        } catch (Exception e) {
            logger.error("Error loading .env file", e);
        }
    }

    private static Path findProjectRoot() {
        Path current = Paths.get("").toAbsolutePath();
        Path search = current;
        while (search != null && search.getParent() != null) {
            if (Files.exists(search.resolve("pom.xml")) || Files.exists(search.resolve(".git"))) {
                return search;
            }
            search = search.getParent();
        }
        return current;
    }

    private static Map<String, String> parseEnvFile(File envFile) throws IOException {
        Map<String, String> out = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(envFile), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq <= 0) continue;
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if (value.length() >= 2 &&
                    ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (!value.isEmpty()) {
                    out.put(key, value);
                }
            }
        }
        return out;
    }

    private static String maskSensitive(String key, String value) {
        String k = key.toLowerCase();
        if (k.contains("password") || k.contains("secret") || k.contains("token") || k.contains("key")) {
            return "***";
        }
        return value;
    }
}
