---
name: Fix WebView Render Connection
overview: Comprehensive plan to fix Android WebView connection issues with Render.com backend, addressing cold starts, TLS session resumption, timeout settings, and WebView-specific configuration.
todos:
  - id: network-security-config
    content: Create network_security_config.xml and update AndroidManifest.xml
    status: pending
  - id: capacitor-config
    content: Update capacitor.config.ts with server and WebView settings
    status: pending
  - id: increase-timeouts
    content: Increase axios and fetch timeouts to handle Render cold starts
    status: pending
  - id: retry-interceptor
    content: Add exponential backoff retry interceptor to axios
    status: pending
  - id: connection-warmup
    content: Create ConnectionWarmupProvider for app startup
    status: pending
  - id: verify-build
    content: Build and test the APK with changes
    status: pending
isProject: false
---

# Fix Android WebView Connection Issues with Render.com Backend

## Root Cause Analysis

Your issue pattern strongly indicates **Render.com cold start behavior** combined with **WebView-specific limitations**:

```mermaid
flowchart TD
    subgraph ProblemSequence[Problem Sequence]
        A[App Cold Launch] --> B[First API Request]
        B --> C{Render Instance Asleep?}
        C -->|Yes - 15min+ idle| D[Cold Start: 5-30s]
        C -->|No| E[Warm Instance: <1s]
        D --> F{Timeout < Cold Start?}
        F -->|Yes (10s/15s)| G[Failed to fetch / Timeout]
        F -->|No| H[Success]
        E --> H
    end
    
    subgraph WebViewVsChrome[WebView vs Chrome]
        I[Chrome Browser] --> J[Aggressive Retry Logic]
        I --> K[QUIC/HTTP3 Fallback]
        I --> L[Better TLS Session Caching]
        M[Android WebView] --> N[Simpler Retry Logic]
        M --> O[May Not Use QUIC]
        M --> P[TLS Session Issues]
    end
```

**Key Issues Identified:**
1. **Timeouts too short**: 10s (fetch) / 15s (axios) < Render cold start (5-30s)
2. **No network_security_config.xml**: Missing explicit domain configuration
3. **No connection warm-up**: First request hits cold instance
4. **WebView defaults**: Not optimized for slow TLS handshakes

## Implementation Plan

### Phase 1: Android Network Configuration

**1.1 Create `network_security_config.xml`**
- File: `android/app/src/main/res/xml/network_security_config.xml`
- Explicitly trust your Render domain
- Configure cleartext traffic if needed for dev
- Enable certificate pinning optionally

**1.2 Update `AndroidManifest.xml`**
- Reference network_security_config in `<application>` tag
- Add `usesCleartextTraffic` attribute (for development if needed)

### Phase 2: Capacitor WebView Configuration

**2.1 Update `capacitor.config.ts`**
- Configure `server` settings for better WebView behavior
- Consider `androidScheme: "https"` for origin consistency

**2.2 Create Custom WebView Plugin (if needed)**
- Enable mixed content if needed
- Configure third-party cookies
- Adjust WebView settings programmatically

### Phase 3: Frontend HTTP Client Improvements

**3.1 Increase Timeouts**
- File: `lib/axios.ts`
  - Increase timeout from 15000ms to 60000ms+
- File: `module/auth/lib/fetch-with-timeout.ts`
  - Increase timeout from 10000ms to 45000ms+

**3.2 Add Exponential Backoff Retry**
- File: `lib/axios.ts`
  - Add retry interceptor for network errors
  - Retry: `Failed to fetch`, timeout, 5xx errors
  - Backoff: 1s → 2s → 4s → 8s

**3.3 Add Connection Warmup Component**
- Create: `components/providers/ConnectionWarmupProvider.tsx`
- Send lightweight `/health` or `/ping` request on app start
- With retries and long timeout
- Block UI or show loading until backend is ready

### Phase 4: Additional Recommendations

**4.1 Enable HTTP/2 on Backend (Node.js)**
- Ensure your Express/Koa server enables HTTP/2
- Render supports HTTP/2 for custom domains with SSL

**4.2 Configure Keep-Alive**
- On backend: Set keep-alive timeout to 60+ seconds
- On frontend: Configure axios keep-alive agent

**4.3 Consider Render Pro Tier**
- Pro tier doesn't sleep instances
- Faster cold starts
- This is a business decision, not code change

## Files to Modify

| File | Action |
|------|--------|
| `android/app/src/main/res/xml/network_security_config.xml` | Create (new) |
| `android/app/src/main/AndroidManifest.xml` | Modify |
| `capacitor.config.ts` | Modify |
| `lib/axios.ts` | Modify |
| `module/auth/lib/fetch-with-timeout.ts` | Modify |
| `components/providers/ConnectionWarmupProvider.tsx` | Create (new) |
| `app/layout.tsx` | Modify (add warmup provider) |

## Verification Steps

After implementing:
1. Build APK: `npm run cap:sync`
2. Install on test device
3. Kill app completely
4. Wait 30+ minutes (for Render to sleep)
5. Launch app and verify first request succeeds
6. Check Eruda console for timing information