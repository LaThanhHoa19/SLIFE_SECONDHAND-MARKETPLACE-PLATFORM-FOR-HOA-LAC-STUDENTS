package com.slife.marketplace.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;

/**
 * Abstraction over file-system operations so service unit tests can stay isolated.
 */
public interface FileStorage {

    void createDirectories(Path dir) throws IOException;

    void copy(InputStream in, Path dest) throws IOException;

    boolean deleteIfExists(Path target) throws IOException;
}

