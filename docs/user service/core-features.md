## Core features

This section dives deep into the core features of User Service. Lets see some of them:

### 1. Login & Sign-Up feature

User service provides login services for user Login and Registration. 

- **Log-In**: With the User service Login, The organization can configure log-in portals into their  applications. The user credentials are stored in the organization auth (like Fusion Auth). The User service provides a ready-made API, which can be leveraged by the application to connect with its Auth for allowing Login.

The key benefits offered by user service are:

1. Readymade backend APIs - Applications can configure their credentials and start using the APIs without doing any backend development. 
2. Load Balancing - The APIs are built in a way that mitigates the DevOps task for the application to manage load in case of event-driven, one-off high usage. It scales horizontally to process all the requests

- Sign Up: User service also provides APIs for creating your own users and creating the entries for the users in the application's auth (Like Fusion Auth). User service can integrate with Application Auth through configuration. It allows for dynamic user attributes to be sent, as per the application's requirements.

### 2. Reset/Forgot Password 

When a user creates a profile but is unable to recall his current password or the user credentials are lost due to some reasons. In such cases, a system to reset the existing password may be very helpful to the user. 

We can invoke a reset password functionality from user service in our applications. If a case arises where the user has forgotten his password he can simply click on the “reset password” button. This action will take the user to a different portal where he will be asked to enter his mobile number in a textfield. The user will then receive an OTP from the user service backend that will contain the steps to reset a user password. For example,

>shiksha saathi "reset password" portal which uses an user service instance

<p align="center">
<img src="images/reset.jpg" width="400" height="600"/>
</p>

Similarly, this exact functionality can be achieved by entering only our username. e-Samwad is an android app that also uses the User service instance. But here, the password can be sent to our phone number just by entering our username in the textfield. 
The user service keeps track of the phone numbers associated with each username. Once the user requests for a reset password action by entering his username, User service instantly sends an OTP to the phone number attached to that particular username. For example:

### 3. Role Based Access Control

Role-based access control (RBAC) is a method of regulating access to computer or network resources based on the roles of individual users within your organization. RBAC ensures people access only information they need to do their jobs and prevents them from accessing information that doesn't concern them.

With user service RBAC, you can create users for your application and assign them specific permissions. These permissions will decide to which limit each user is allowed to access information. The aim of introducing RBAC in user service was to enhance the security of the organization applications and make the job of system administrators easy and efficient.


### 4. JWT/Basic Authentication Strategies

JSON Web Tokens is an authentication standard that works by assigning and passing around an encrypted token in requests that helps to identify the logged in user, instead of storing the user in a session on the server and creating a cookie.

Simply put,it is a strategy for authenticating with a JSON Web Token. This module lets you authenticate endpoints using a JSON web token. It is intended to be used to secure RESTful endpoints without sessions. 

JWT is better suited for organizations who want advanced authentications for their applications due to security reasons. Integrate JWT Authentication strategies using User service to efficiently find a secure way to authenticate users and share information. 

### 5. CRUD Operations on a User

As we know, the User service allows us to create a user in the database. But with that, it also allows us to perform various actions on the created user. Some of these actions are Create, Retrieve, Update and Delete. Also formally known as “CRUD” operations. We have already learnt about Creating a user in the RBAC section above. Lets learn about the importance of other operations in a software.

CRUD operations may be important in various situations and use cases. Lets say, you want to retrieve the information of a customer who has the highest amount of purchases in a week on an E-commerce website. With user service, the admin can easily retrieve the information of that customer with one click.

Similarly, the website admin can update the details associated with a user. The admin can modify the information saved within a database related to that particular user. For example, he can modify the faulty information attached to the user. If needed, the admin can delete the user and all the related information associated with him/her from the organization databases.

### 6. Login on OTP based Model

Just like how we can use an OTP in user service to reset the forgotten password of a user. We can also use the OTP to log in a user in the organization portal. The OTP based login model is quite different from the standard Username-Password model.

One crucial advantage of and primary reason for using OTPs is security. Since a single-use password will change with each login attempt, the risk of an account being compromised is drastically reduced, if not eliminated. 

User service OTPs are randomly generated and sent directly to your mobile phone. Randomly generated strings of characters are virtually impossible to guess.

