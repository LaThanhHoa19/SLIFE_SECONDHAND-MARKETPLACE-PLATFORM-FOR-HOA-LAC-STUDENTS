/**
 * Mục đích: Service AuthService – chỉ hỗ trợ đăng nhập Google SSO (email @fpt.edu.vn).
 */
package com.slife.marketplace.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String ALLOWED_DOMAIN = "fpt.edu.vn";

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    @Autowired private ListingRepository listingRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ConversationRepository conversationRepository;
    @Autowired private MessageRepository messageRepository;

    public AuthService(
            UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            @Value("${google.clientId}") String googleClientId
    ) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        if (googleClientId == null || googleClientId.isBlank() || "replace-client-id".equals(googleClientId)) {
            throw new IllegalStateException("Google Client ID is not configured. Set GOOGLE_CLIENT_ID in environment or application properties.");
        }
        this.googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * Đăng nhập bằng Google ID token. Chỉ chấp nhận email đuôi @fpt.edu.vn.
     * Tạo user mới nếu chưa tồn tại.
     */
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdToken googleIdToken;
        try {
            googleIdToken = googleIdTokenVerifier.verify(idToken);
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        if (googleIdToken == null) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        email = email.toLowerCase();

        // Chỉ cho phép domain fpt.edu.vn (hd claim hoặc email kết thúc bằng @fpt.edu.vn)
        String hd = payload.getHostedDomain();
        boolean domainOk = ALLOWED_DOMAIN.equalsIgnoreCase(hd) || email.endsWith("@" + ALLOWED_DOMAIN);
        if (!domainOk) {
            throw new SlifeException(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED);
        }

        String name = (String) payload.get("name");
        final String fullName = (name != null && !name.isBlank()) ? name : email.substring(0, email.indexOf('@'));
        final String pictureUrl = (String) payload.get("picture");
        final String emailFinal = email;

        User user = userRepository.findByEmail(email).orElseGet(() -> createUserFromGoogle(emailFinal, fullName, pictureUrl));

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        String token = jwtTokenProvider.generateToken(email, claims);

        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setRefreshToken(null);
        response.setUser(user);
        return response;
    }

    private User createUserFromGoogle(String email, String fullName, String avatarUrl) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName != null ? fullName : email);
        user.setPasswordHash(null);
        user.setAvatarUrl(avatarUrl);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setReputationScore(BigDecimal.valueOf(5.00));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private static final String TEST_ALICE = "alice@example.com";
    private static final String TEST_BOB = "bob@example.com";

    /**
     * Đăng nhập tài khoản test (Alice, Bob). Nếu chưa có trong DB thì tạo mới để test giao diện.
     */
    public AuthResponse issueTokenForDev(String email) {
        if (email == null || email.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        String normalized = email.trim().toLowerCase();
        if (!TEST_ALICE.equals(normalized) && !TEST_BOB.equals(normalized)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        User user = userRepository.findByEmail(normalized)
                .orElseGet(() -> createTestUser(normalized));
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        String token = jwtTokenProvider.generateToken(user.getEmail(), claims);
        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setRefreshToken(null);
        response.setUser(user);
        return response;
    }

    private User createTestUser(String email) {
        String fullName = TEST_ALICE.equals(email) ? "Alice Nguyen" : "Bob Tran";
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPasswordHash(null);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setReputationScore(BigDecimal.valueOf(5.00));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Tạo environment test chat: đảm bảo Alice có listing, tạo conversation giữa Bob (buyer) và Alice (seller).
     * Đồng thời MERGE các "Alice seed" (cùng tên nhưng khác ID) vào Alice test để tránh split conversations.
     * Trả về { sessionId, listingId, aliceToken, bobToken, aliceId, bobId }.
     */
    @Transactional
    public Map<String, Object> setupTestChat() {
        // 1. Ensure Alice and Bob test users exist
        User alice = userRepository.findByEmail(TEST_ALICE).orElseGet(() -> createTestUser(TEST_ALICE));
        User bob = userRepository.findByEmail(TEST_BOB).orElseGet(() -> createTestUser(TEST_BOB));

        // 2. Merge any "Alice seed" duplicates (same full name, different ID) into Alice test
        mergeOldUsersIntoTest(alice);
        mergeOldUsersIntoTest(bob);

        // 3. Ensure Alice has at least one ACTIVE listing (after merge, may already have some)
        List<Listing> aliceListings = listingRepository.findBySellerAndStatus(alice, "ACTIVE");
        Listing listing;
        if (aliceListings.isEmpty()) {
            listing = createTestListingForAlice(alice);
        } else {
            listing = aliceListings.get(0);
        }

        // 4. Tìm-hoặc-tạo conversation Bob↔Alice cho listing này.
        //    Không đóng/xóa conv cũ để tránh vi phạm unique constraint (user_id1, user_id2, listing_id).
        final Long aliceId = alice.getId();
        final Long bobId = bob.getId();
        final Long listingId = listing.getId();

        // Tìm bất kỳ conv nào (cả ACTIVE lẫn CLOSED) có Bob và Alice cho listing này
        Conversation conv = conversationRepository.findAll().stream()
                .filter(c -> c.getListing() != null && c.getListing().getId().equals(listingId)
                        && ((c.getUserId1().getId().equals(bobId) && c.getUserId2().getId().equals(aliceId))
                        || (c.getUserId1().getId().equals(aliceId) && c.getUserId2().getId().equals(bobId))))
                .findFirst()
                .orElse(null);

        if (conv == null) {
            // Tạo mới hoàn toàn
            conv = new Conversation();
            conv.setUserId1(bob);
            conv.setUserId2(alice);
            conv.setListing(listing);
        }
        // Luôn đảm bảo conv ACTIVE và có sessionUuid
        conv.setStatus(Conversation.STATUS_ACTIVE);
        if (conv.getSessionUuid() == null) {
            conv.ensureSessionUuid();
        }
        if (conv.getCreatedAt() == null) {
            conv.setCreatedAt(Instant.now());
        }
        conv = conversationRepository.save(conv);

        // 5. Seed a starter message từ Bob nếu conv chưa có message nào
        long msgCount = messageRepository.findByConversation_IdOrderBySentAtDesc(conv.getId(),
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
        if (msgCount == 0) {
            Message msg = new Message();
            msg.setConversation(conv);
            msg.setSender(bob);
            msg.setContent("Xin chào! Mình quan tâm đến sản phẩm này, còn không ạ?");
            msg.setSentAt(Instant.now());
            msg.setIsRead(false);
            messageRepository.save(msg);
            conv.setLastMessageAt(msg.getSentAt());
            conv = conversationRepository.save(conv);
        }

        // 6. Issue tokens
        Map<String, Object> aliceClaims = new HashMap<>();
        aliceClaims.put("userId", alice.getId());
        aliceClaims.put("role", alice.getRole());
        String aliceToken = jwtTokenProvider.generateToken(alice.getEmail(), aliceClaims);

        Map<String, Object> bobClaims = new HashMap<>();
        bobClaims.put("userId", bob.getId());
        bobClaims.put("role", bob.getRole());
        String bobToken = jwtTokenProvider.generateToken(bob.getEmail(), bobClaims);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", conv.getSessionUuid());
        result.put("listingId", listing.getId());
        result.put("aliceId", alice.getId());
        result.put("bobId", bob.getId());
        result.put("aliceToken", aliceToken);
        result.put("bobToken", bobToken);
        return result;
    }

    /**
     * Merge tất cả "seed user" có cùng tên với testUser vào testUser.
     * Chỉ UPDATE (không DELETE) để tránh vi phạm FK constraints với deals/reviews/offers.
     * - Cập nhật listings: seller → testUser
     * - Cập nhật conversations: user_id1/user_id2 → testUser (nếu không tạo self-chat)
     */
    private void mergeOldUsersIntoTest(User testUser) {
        List<User> duplicates = userRepository.findDuplicatesByFullName(testUser.getFullName(), testUser.getId());
        if (duplicates.isEmpty()) return;

        for (User old : duplicates) {
            // Reassign listings
            listingRepository.findBySeller(old).forEach(l -> {
                l.setSeller(testUser);
                listingRepository.save(l);
            });
            // Reassign conversations where old user is participant — chỉ UPDATE, không DELETE
            List<Conversation> oldConvs = conversationRepository.findAllByParticipantOrderByLastMessageDesc(old.getId());
            for (Conversation c : oldConvs) {
                User newU1 = c.getUserId1().getId().equals(old.getId()) ? testUser : c.getUserId1();
                User newU2 = c.getUserId2().getId().equals(old.getId()) ? testUser : c.getUserId2();
                // Bỏ qua nếu sau merge sẽ thành self-chat
                if (newU1.getId().equals(newU2.getId())) {
                    c.setStatus(Conversation.STATUS_CLOSED);
                    conversationRepository.save(c);
                    continue;
                }
                c.setUserId1(newU1);
                c.setUserId2(newU2);
                conversationRepository.save(c);
            }
            log.info("setupTestChat: merged old user id={} name='{}' into testUser id={}", old.getId(), old.getFullName(), testUser.getId());
        }
    }

    private Listing createTestListingForAlice(User alice) {
        Category cat = categoryRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().stream().findFirst().orElse(null);
        Listing l = new Listing();
        l.setSeller(alice);
        l.setCategory(cat);
        l.setTitle("iPhone 12 cũ - Test listing của Alice");
        l.setDescription("Đây là listing test để thử tính năng chat. Máy còn đẹp, pin 90%.");
        l.setPrice(BigDecimal.valueOf(8_500_000));
        l.setItemCondition("USED_GOOD");
        l.setStatus("ACTIVE");
        l.setPurpose("SALE");
        l.setIsGiveaway(false);
        l.setCreatedAt(Instant.now());
        l.setUpdatedAt(Instant.now());
        l.setExpirationDate(Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS));
        return listingRepository.save(l);
    }
}
