package com.slife.marketplace.integrations.google;

import java.util.Map;

/**
 * Thin abstraction over Google OAuth HTTP calls so service unit tests stay isolated.
 */
public interface GoogleOAuthClient {

    Map<String, Object> verifyIdToken(String idToken);

    Map<String, Object> exchangeCodeForTokens(String code,
                                              String redirectUri,
                                              String googleClientId,
                                              String googleClientSecret);
}

