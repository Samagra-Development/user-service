## Core features

If you’re not familiar with what User service offers, let’s learn more about it. This section dives deep into the core features of User Service. Here you can gain an understanding of the key features you can utilize in your project. Lets see some of them:

### 1. Built-in Login feature

User service provides built-in login services for user sign up and sign in. The organization can modify and customize this service according to their own needs. You can use user service to add registration and login portals to your Android apps, IOS apps or a Website. 

An organization can create their own instance of the User service and integrate the login feature within their software to access these functionalities. The user credentials like Username and Password will be stored centrally on the user service server hosted on Samagra.

### 2. Create/Retrieve/Update/Delete operations on User

When a user creates a profile but is unable to recall his current password or the user credentials are lost due to some reasons. In such cases, a system to reset the existing password may be very helpful to the user. 

We can invoke a reset password functionality from user service in our android and web applications. 

### 3. Reset/Forgot Password 

When a user creates a profile but is unable to recall his current password or the user credentials are lost due to some reasons. In such cases, a system to reset the existing password may be very helpful to the user. 

We can invoke a reset password functionality from user service in our android and web applications. If a case arises where the user has forgotten his password he can simply click on the “reset password” button. This action will take the user to a different portal where he will be asked to enter his mobile number in a textfield. The user will then receive an OTP from the user service backend that will contain the steps to reset a user password. For example,

>shiksha saathi "reset password" portal which uses an user service instance

<p align="center">
<img src="images/reset.jpg"/>
</p>

Similarly, this exact functionality can be achieved by entering only our username. e-Samwad is an android app that also uses the User service instance. But here, the password can be sent to our phone number just by entering our username in the textfield. 
The user service keeps track of the phone numbers associated with each username. Once the user requests for a reset password action by entering his username, User service instantly sends an OTP to the phone number attached to that particular username. For example:

>e-samwad app’s “reset password” portal

<p align="center">
<img src="images/resetSamwad.jpg"/>
</p>

### 4. RBAC

### 5. JWT/Basic Auth Strategies

### 6. User Creation and login on OTP based model (Available channels: Gupshup/CDAC)

