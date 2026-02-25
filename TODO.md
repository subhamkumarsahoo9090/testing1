# TODO: Implement Email Verification and Login Backend

- [x] Update package.json to add nodemailer dependency
- [x] Update model/userModal.js: rename isVerified to isEmailVerified, add emailVerificationToken and emailVerificationExpires
- [x] Create utils/sendEmail.js for email sending utility
- [x] Update controller/userController.js:
  - Modify userRegister to generate token, set isEmailVerified: false, send verification email
  - Add verifyEmail function
  - Update userLogin to check isEmailVerified
  - Add resendVerificationEmail function
- [x] Update router/userRouter.js to add verify-email and resend-verification routes
- [x] Install dependencies with npm install
- [ ] Test the endpoints
