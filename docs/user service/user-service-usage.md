## Prerequisites

Prequisites required for using User service:

1. Host application

2. Host User management service - Fusion auth supported

3. SMS service provider credentials

## Setup

Setup the User service instance for your application:

Configuration update:

1. On the user service, Share these <> credentials with the administrator to register your application

## Test the APIs

Once your app is configured, you can test the following APIs.

1. [Login API](/src/admin/fusionauth/)
2. [Reset password API](core-features.md#2-resetforgot-password)
3. [User data (CRUD)](/src/user/user-db/)

## Calling the APIs from your application

1. On your app, you need to call the user service APIs, using the token provided for your Application.
2. Sample code 

```ts
code
```
