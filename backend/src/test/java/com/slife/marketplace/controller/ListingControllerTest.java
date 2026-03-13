/**
 * Mục đích: Test skeleton.
 * TODO: Hoàn thiện kịch bản test theo use case.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.config.SecurityConfig;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
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
                .andExpect(status().isNotFound());
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
                .andExpect(status().isOk());
    }

    @Test
    void getListings_withValidCategory_shouldParseAndCallService() throws Exception {
        // Arrange
        String categoryStr = "123";
        Long expectedCategoryId = 123L;

        PagedResponse<ListingResponse> emptyResponse = new PagedResponse<>();
        emptyResponse.setContent(List.of());

        // Giả lập: Khi truyền category 123L xuống service
        when(listingService.getFilteredListings(eq(expectedCategoryId), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()))
                .thenReturn(emptyResponse);

        // Act & Assert
        mockMvc.perform(get("/api/listings")
                        .param("category", categoryStr)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void getListings_withInvalidCategory_shouldPassNullToService() throws Exception {
        // Arrange
        String invalidCategory = "abc";

        PagedResponse<ListingResponse> emptyResponse = new PagedResponse<>();
        emptyResponse.setContent(List.of());

        // Giả lập: Khi parse lỗi, controller phải truyền null xuống service
        when(listingService.getFilteredListings(isNull(), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()))
                .thenReturn(emptyResponse);

        // Act & Assert
        mockMvc.perform(get("/api/listings")
                        .param("category", invalidCategory)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void getListings_withCategoryHavingSpaces_shouldTrimAndParse() throws Exception {
        String categoryWithSpaces = "  123  ";
        Long expectedId = 123L;

        PagedResponse<ListingResponse> emptyResponse = new PagedResponse<>();
        emptyResponse.setContent(List.of());

        when(listingService.getFilteredListings(eq(expectedId), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()))
                .thenReturn(emptyResponse);

        mockMvc.perform(get("/api/listings").param("category", categoryWithSpaces))
                .andExpect(status().isOk());
    }

    @Test
    void getListings_withFullParams_shouldPassAllToService() throws Exception {
        when(userService.getCurrentUserOptional()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/listings")
                        .param("category", "1")
                        .param("location", "Hanoi")
                        .param("q", "laptop")
                        .param("sort", "price,asc")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk());

        // Verify service nhận đúng giá trị (1L, "Hanoi", "laptop", ...)
        org.mockito.Mockito.verify(listingService).getFilteredListings(
                eq(1L), eq("Hanoi"), eq("laptop"), eq("price,asc"), eq(1), eq(20), isNull()
        );
    }

    @Test
    void getListings_withLoggedInUser_shouldPassUserToService() throws Exception {
        User mockUser = new User();
        mockUser.setId(99L);

        when(userService.getCurrentUserOptional()).thenReturn(Optional.of(mockUser));
        when(listingService.getFilteredListings(isNull(), isNull(), isNull(), anyString(), eq(0), eq(10), eq(mockUser)))
                .thenReturn(new PagedResponse<>());

        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk());
    }

    @Test
    void getListings_withBlankCategory_shouldPassNullToService() throws Exception {
        // Test trường hợp category là chuỗi rỗng sau khi trim
        mockMvc.perform(get("/api/listings")
                        .param("category", "   ")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Kiểm tra xem Service có nhận giá trị null không
        org.mockito.Mockito.verify(listingService).getFilteredListings(
                isNull(), isNull(), isNull(), anyString(), eq(0), eq(10), isNull()
        );
    }
}