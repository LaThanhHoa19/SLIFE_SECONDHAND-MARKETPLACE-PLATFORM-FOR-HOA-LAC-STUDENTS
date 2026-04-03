/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.config.SecurityConfig;
import com.slife.marketplace.dto.response.ListingCardResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.service.BlockService;
import com.slife.marketplace.service.ListingLikeService;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.ListingImageService;
import com.slife.marketplace.service.SavedListingService;
import com.slife.marketplace.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ListingController.class)
@Import(SecurityConfig.class)
class ListingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ListingService listingService;

    @MockBean
    private BlockService blockService;

    @MockBean
    private ListingLikeService listingLikeService;

    @MockBean
    private UserService userService;

    @MockBean
    private ListingRepository listingRepository;

    @MockBean
    private SavedListingService savedListingService;

    @MockBean
    private ListingImageService listingImageService;

    @MockBean
    private com.slife.marketplace.config.UploadResourceConfig uploadResourceConfig;

    @MockBean
    private com.slife.marketplace.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private com.slife.marketplace.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.slife.marketplace.repository.UserRepository userRepository;

    @BeforeEach
    void setUpFilterPassThrough() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.ServletRequest request = invocation.getArgument(0);
            jakarta.servlet.ServletResponse response = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    void getListings_withoutAuth_shouldReturn200AndData() throws Exception {
        ListingCardResponse listing = new ListingCardResponse();
        listing.setId(1L);
        listing.setTitle("Sample listing");

        PagedResponse<ListingCardResponse> response = new PagedResponse<>();
        response.setContent(List.of(listing));
        response.setTotalElements(1L);
        response.setTotalPages(1);
        response.setPage(0);
        response.setSize(20);

        when(listingService.getActiveListingCards(eq(0), eq(10), any(), any(), anyBoolean()))
                .thenReturn(response);

        mockMvc.perform(get("/api/listings")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.content[0].title").value("Sample listing"));
    }

    @Test
    void getListingsLegacyPath_withoutAuth_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/listing")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }


    @Test
    void getListings_whenServiceThrows_shouldReturn500WithErrorPayloadNot403() throws Exception {
        when(listingService.getActiveListingCards(eq(0), eq(10), any(), any(), anyBoolean()))
                .thenThrow(new RuntimeException("Simulated DB failure"));

        mockMvc.perform(get("/api/listings")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("Internal server error"));
    }

    @Test
    void createListing_withoutAuth_shouldReturn200() throws Exception {
        mockMvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void listingsPreflight_withoutAuth_shouldNotReturn403() throws Exception {
        mockMvc.perform(options("/api/listings")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}