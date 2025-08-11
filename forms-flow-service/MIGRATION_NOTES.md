# KeycloakService Refactoring: Migration from keycloak-js to oidc-client-ts

## Overview
The KeycloakService has been successfully refactored to use `oidc-client-ts` instead of `keycloak-js`. This modern OIDC library provides better TypeScript support, more flexibility, and follows standard OIDC protocols.

## Key Changes Made

### 1. Package Dependencies
- **Removed**: `keycloak-js` (v25.0.4)
- **Added**: `oidc-client-ts` (v3.0.1)

### 2. Import Changes
```typescript
// Before (keycloak-js)
import Keycloak, {
    KeycloakInitOptions,
    KeycloakTokenParsed,
    KeycloakConfig,
} from "keycloak-js";

// After (oidc-client-ts)
import { 
  UserManager, 
  User, 
  UserManagerSettings,
  WebStorageStateStore,
  Log
} from "oidc-client-ts";
```

### 3. Configuration Changes
The service now uses `UserManagerSettings` instead of Keycloak-specific configuration:

```typescript
// Before
private _keycloakConfig: KeycloakConfig
private kc: Keycloak

// After  
private _userManagerConfig: UserManagerSettings
private userManager: UserManager
```

### 4. Authentication Flow Updates

#### Configuration
- Authority URL format: `${url}/realms/${realm}` (compatible with Keycloak)
- Response type: `code` (PKCE flow)
- Scopes: `"openid profile email offline_access"`
- Automatic silent renewal enabled
- Web storage for state management

#### Event Handlers
Added comprehensive event handling for:
- Access token expiring/expired
- Silent renew errors
- User loaded/unloaded events

### 5. Method Refactoring

#### Core Methods
- `initKeycloak()` → `initKeycloak()` (maintained same interface)
- `login()` → `signinRedirect()`
- `logout()` → `signoutRedirect()`
- `updateToken()` → `signinSilent()`

#### New Methods Added
- `handleCallback()` - Handle authentication redirect callback
- `extractUserRoles()` - Extract roles from OIDC token claims
- `setupEventHandlers()` - Configure OIDC event listeners
- `handleUserLoaded()`/`handleUserUnloaded()` - User state management

### 6. Token Management
- Automatic token refresh via `automaticSilentRenew`
- Improved token expiration handling
- Better offline mode support
- Consistent storage management

### 7. Role Extraction
The service now supports multiple role claim formats:
- `resource_access.{client-id}.roles` (Keycloak style)
- `realm_access.roles` (Keycloak realm roles)
- `roles` (direct roles claim)
- `groups` (groups as roles)

### 8. Static Files Created
- `public/silent-check-sso.html` - Silent authentication iframe
- `public/callback.html` - Authentication callback handler

## Benefits of Migration

1. **Better TypeScript Support**: Full type safety and IntelliSense
2. **Standard Compliance**: Follows OIDC/OAuth2 standards
3. **Improved Error Handling**: Better error reporting and recovery
4. **Automatic Token Management**: Built-in silent renewal
5. **Flexibility**: Works with any OIDC-compliant provider
6. **Modern Architecture**: Event-driven design pattern
7. **Better Testing**: Easier to mock and test

## Breaking Changes

### API Changes
- `userLogout()` is now async and returns Promise<void>
- `initKeycloak()` callback parameter now expects boolean instead of any
- `isAuthenticated()` now checks token expiration status
- Added new methods: `getUser()`, `handleCallback()`

### Configuration Changes
- Redirect URIs must be configured to point to `/callback`
- Silent check SSO URI points to `/silent-check-sso.html`
- Client must support PKCE flow

## Migration Checklist

- [x] Update package dependencies
- [x] Refactor service implementation
- [x] Update imports and types
- [x] Create static HTML files
- [x] Test build process
- [ ] Update application routes to handle `/callback` path
- [ ] Test authentication flow end-to-end
- [ ] Update any consuming components that rely on changed APIs

## Next Steps

1. **Route Configuration**: Ensure your application handles the `/callback` route
2. **Testing**: Thoroughly test the authentication flow
3. **Error Handling**: Verify error scenarios work as expected
4. **Documentation**: Update any API documentation for consuming applications

## Compatibility Notes

The refactored service maintains backward compatibility for most public methods while providing enhanced functionality and better error handling. The offline mode support and role extraction have been improved to work with various OIDC token formats.
