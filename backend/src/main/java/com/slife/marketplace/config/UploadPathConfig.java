package com.slife.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Resolves upload directory to an absolute path outside Tomcat work dir.
 * When app.upload.dir is relative (e.g. "uploads"), use user.home/slife-uploads
 * so uploads work regardless of process working directory (e.g. IDE using Tomcat temp).
 */
@Configuration
public class UploadPathConfig {

    private static final String FALLBACK_SUBDIR = "slife-uploads";

    @Bean
    public Path uploadBasePath(@Value("${app.upload.dir:uploads}") String uploadDir) {
        Path p = Paths.get(uploadDir);
        if (!p.isAbsolute()) {
            String userHome = System.getProperty("user.home");
            p = Paths.get(userHome, FALLBACK_SUBDIR);
        }
        return p.toAbsolutePath().normalize();
    }
}
