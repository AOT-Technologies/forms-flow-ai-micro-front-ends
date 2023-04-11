# forms-flow-service

This is a utility module which exposes the following services across all modules
 - `KeycloakService`
 - `RequestService`
 - `StorageService`

1. KeycloakService
   
| Method    | Description | Parameters| 
| -------- | ------- | ------- |
| getInstance  | Returns the keycloak instance | `url` - valid keycloak url, `realm` - valid keycloak relm, `clientId` - valid keycloak clientId, `tenantId` - Optional - valid tenant Id   |
| initKeycloak | Initialize the keycloak | `callback` - callback function to excecute after successfull authentication     |
| userLogout    | Logs the user out and clear all user data from session. | `null`    |
| getToken | Returns the user token | `null` |
| getUserData | Returns the user details | `null` |
| isAuthenticated | Returns `true` if authenticated `false` otherwise | `null` |


2. RequestService
   
| Method    | Description | Parameters| 
| -------- | ------- | ------- |
| httpGETRequest  |  | `url` - request url, `data` -optional -  json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false`, `headers` - optional - valid headers for the request |
| httpGETBlobRequest |  | `url` - request url, `data` -optional -  json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false`, `headers` - optional - valid headers for the request |
| httpPOSTRequest    |  | `url` - request url, `data` - valid json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false`, `headers` - optional - valid headers for the request  |
| httpPOSTBlobRequest |  | `url` - request url, `data` - valid json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false`, `headers` - optional - valid headers for the request |
| httpPOSTRequestWithoutToken |  | `url` - request url, `data` - valid json payload |
| httpPOSTRequestWithHAL |  | `url` - request url, `data` - valid json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false` |
| httpPUTRequest |  | `url` - request url, `data` - valid json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false` |
| httpDELETERequest |  | `url` - request url, `data` - valid json payload, `token` - optional - auth token, `isBearer` - Optional - whether to use Bearer flag default `false` |
| httpPUTRequestWithoutToken |  | `url` - request url, `data` - valid json payload |
 
 
 3. StorageService
   
| Method    | Description | Parameters| 
| -------- | ------- | ------- |
| get  | Returns the current value present in the session storage for the given key, null if key is not present | `key`  |
| save | sets a new value for the key if present in the session storage new key/value pair is created if the key is not present | `key`, `value`    |
| delete    | removes the key value pair from the session storage | `key`    |
| clear | Removes all key/value pairs present in the session storage | `null` |
