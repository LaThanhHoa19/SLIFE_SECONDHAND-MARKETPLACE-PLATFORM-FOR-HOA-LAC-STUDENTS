/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.config.SecurityConfig;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
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
    private UserService userService;

    @MockBean
    private com.slife.marketplace.config.UploadResourceConfig uploadResourceConfig;

    @MockBean
    private com.slife.marketplace.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.slife.marketplace.repository.UserRepository userRepository;

    @Test
    void getListings_withoutAuth_shouldReturn200AndData() throws Exception {
        ListingResponse listing = new ListingResponse();
        listing.setId(1L);
        listing.setTitle("Sample listing");

        PagedResponse<ListingResponse> response = new PagedResponse<>();
        response.setContent(List.of(listing));
        response.setTotalElements(1L);
        response.setTotalPages(1);
        response.setPage(0);
        response.setSize(10);

        when(userService.getCurrentUserOptional()).thenReturn(Optional.empty());
        when(listingService.getFilteredListings(isNull(), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()))
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
    void getListingsLegacyPath_withoutAuth_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/listing")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }


    @Test
    void getListings_whenServiceThrows_shouldReturn500WithErrorPayloadNot403() throws Exception {
        when(userService.getCurrentUserOptional()).thenReturn(Optional.empty());
        when(listingService.getFilteredListings(isNull(), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()))
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
    void createListing_withoutAuth_shouldReturn403() throws Exception {
        mockMvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listingsPreflight_withoutAuth_shouldNotReturn403() throws Exception {
        mockMvc.perform(options("/api/listings")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}