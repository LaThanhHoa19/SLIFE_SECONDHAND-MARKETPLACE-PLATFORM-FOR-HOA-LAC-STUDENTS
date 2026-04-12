package com.slife.marketplace.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "s3")
public class AwsS3ClientConfig {

    @Bean(destroyMethod = "close")
    public S3Client slifeS3Client(StorageProperties storageProperties) {
        String region = storageProperties.getS3().getRegion();
        if (region == null || region.isBlank()) {
            region = "ap-southeast-1";
        }
        return S3Client.builder()
                .region(Region.of(region.trim()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
