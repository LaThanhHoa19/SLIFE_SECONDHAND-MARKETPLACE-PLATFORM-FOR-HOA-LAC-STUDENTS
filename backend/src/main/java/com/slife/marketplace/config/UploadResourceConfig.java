package com.slife.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

    private final Path uploadBasePath;

    public UploadResourceConfig(Path uploadBasePath) {
        this.uploadBasePath = uploadBasePath;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + uploadBasePath + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
