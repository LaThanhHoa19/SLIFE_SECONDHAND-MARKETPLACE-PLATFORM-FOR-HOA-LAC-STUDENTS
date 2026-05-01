package com.slife.marketplace.storage;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Component
public class NioFileStorage implements FileStorage {

    @Override
    public void createDirectories(Path dir) throws IOException {
        Files.createDirectories(dir);
    }

    @Override
    public void copy(InputStream in, Path dest) throws IOException {
        Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public boolean deleteIfExists(Path target) throws IOException {
        return Files.deleteIfExists(target);
    }
}

