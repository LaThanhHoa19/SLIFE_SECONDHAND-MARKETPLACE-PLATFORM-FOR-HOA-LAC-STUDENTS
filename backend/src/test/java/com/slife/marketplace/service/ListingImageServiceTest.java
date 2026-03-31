package com.slife.marketplace.service;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingImageServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private ConfigService configService;

    private ListingImageService listingImageService;

    @BeforeEach
    void setUp() throws Exception {
        Path uploadBasePath = Files.createTempDirectory("listing-image-test");
        listingImageService = new ListingImageService(
                listingRepository,
                listingImageRepository,
                configService,
                uploadBasePath
        );
    }

    @Test
    void uploadListingImages_whenCurrentUserIsNotOwner_shouldThrowForbidden() {
        Listing listing = new Listing();
        listing.setId(100L);
        User owner = new User();
        owner.setId(1L);
        listing.setSeller(owner);

        User attacker = new User();
        attacker.setId(2L);

        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

        MockMultipartFile image = new MockMultipartFile(
                "images",
                "phone.jpg",
                "image/jpeg",
                "fake-image".getBytes()
        );

        SlifeException ex = assertThrows(
                SlifeException.class,
                () -> listingImageService.uploadListingImages(100L, List.of(image), attacker)
        );

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verify(listingImageRepository, never()).save(ArgumentMatchers.any());
    }
}
