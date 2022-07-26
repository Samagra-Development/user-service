## Prerequisites

Prequisites required for using User service:

1. Host application

2. Host User management service - Fusion auth supported

3. SMS service provider credentials - User service has two channels used for SMS providers, they are [Gupshup](/src/user/sms/gupshup/) and [CDAC](/src/user/sms/cdac/). However, you can also configure a custom channel for an SMS provider.

## Setup

>*how to exactly configure and setup user service within an software application by (to be confirmed by Radhey). i.e how can an end-user setup an authentication gateway(or other user service gateways) on his own software application and use it*

Setup the User service instance for your application:

Configuration update:

1. On the user service, Share these <> credentials with the administrator to register your application

## Test the APIs

Once your app is configured, you can test the following APIs.

1. [Login API](/src/admin/fusionauth/)
2. [Reset password API](/src/user/sms/)
3. [User data (CRUD)](/src/user/user-db/)
..
4. More APIs coming soon

## Calling the APIs from your application

>*this section needs to be covered in detail after confirming the exact process and code sample details with radhey*

1. On your app, you need to call the user service APIs, using the token provided for your Application.
2. Sample code 

```ts
code
```
