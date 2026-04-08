package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceCreateValidationTest {

    @Mock
    private ListingRepository listingRepository;
    @Mock
    private ListingImageRepository listingImageRepository;
    @Mock
    private SavedListingRepository savedListingRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private AddressRepository addressRepository;
    @Mock
    private FollowService followService;
    @Mock
    private BlockService blockService;
    @Mock
    private ListingLikeRepository listingLikeRepository;
    @Mock
    private ListingImageService listingImageService;
    @Mock
    private ConfigService configService;
    @Mock
    private NotificationService notificationService;

    @Mock
    private ListingExpiryBatchService listingExpiryBatchService;
    @Mock
    private SystemEmailService systemEmailService;

    @Mock
    private ContentModerationService contentModerationService;

    private ListingService listingService;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(
                listingRepository,
                listingImageRepository,
                savedListingRepository,
                categoryRepository,
                addressRepository,
                followService,
                blockService,
                listingLikeRepository,
                listingImageService,
                configService,
                notificationService,
                listingExpiryBatchService,
                systemEmailService,
                contentModerationService
        );
    }

    @Test
    void createListing_whenDraftAndMissingRequiredFields_shouldCreateDraft() {
        User seller = new User();
        seller.setId(10L);

        CreateListingRequest request = new CreateListingRequest();
        request.setIsDraft(true);
        request.setTitle("   ");
        request.setDescription("draft body");
        request.setPrice(null);
        request.setCategoryId(null);

        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
            Listing listing = invocation.getArgument(0);
            listing.setId(999L);
            return listing;
        });

        ListingResponse response = listingService.createListing(seller, request);

        assertNotNull(response);
        assertEquals(999L, response.getId());

        ArgumentCaptor<Listing> captor = ArgumentCaptor.forClass(Listing.class);
        org.mockito.Mockito.verify(listingRepository).save(captor.capture());
        Listing saved = captor.getValue();
        assertEquals("DRAFT", saved.getStatus());
        assertEquals("Bản nháp chưa đặt tiêu đề", saved.getTitle());
    }

    @Test
    void createListing_whenActiveWithoutPickupLocation_shouldThrowInvalidInput() {
        User seller = new User();
        seller.setId(10L);

        Category category = new Category();
        category.setId(22L);
        when(categoryRepository.findById(22L)).thenReturn(Optional.of(category));

        CreateListingRequest request = new CreateListingRequest();
        request.setIsDraft(false);
        request.setTitle("Laptop cũ");
        request.setCategoryId(22L);
        request.setPrice(BigDecimal.valueOf(1200000));
        request.setPickupLocationName("  ");

        SlifeException ex = assertThrows(
                SlifeException.class,
                () -> listingService.createListing(seller, request)
        );

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        assertEquals("Vui lòng chọn địa điểm giao dịch", ex.getMessage());
    }
}
