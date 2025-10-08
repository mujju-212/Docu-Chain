# Testing Authentication UI

## ✅ Login Page Testing (http://localhost:5175/login)

### Visual Elements to Verify:
- [ ] **Left Panel:**
  - [ ] DocChain logo (green gradient circle with "D")
  - [ ] "Hello, Welcome Back" heading
  - [ ] Email input field with mail icon
  - [ ] Password input field with lock icon and show/hide toggle
  - [ ] "Remember me" checkbox
  - [ ] "Forgot Password?" link
  - [ ] "Sign In" button (green gradient)
  - [ ] "Connect Wallet" button (light green)
  - [ ] Hint text about EVM wallet
  - [ ] "Sign Up" link at bottom

- [ ] **Right Panel:**
  - [ ] Green gradient background
  - [ ] Inner border glow effect
  - [ ] "Verified" bubble (white card, top-left area)
  - [ ] Lock icon card (white card, bottom-right)
  - [ ] 4 white cloud circles in corners
  - [ ] Phone illustration with:
    - [ ] Dark phone body
    - [ ] Green gradient screen
    - [ ] Camera notch at top
    - [ ] Fingerprint rings (3 circles in center)
    - [ ] Progress bar below fingerprint
    - [ ] Gear/settings icon (top-right of screen)

### Functional Testing:
1. **Email Validation:**
   - [ ] Enter invalid email → Should show error
   - [ ] Enter valid email → Should accept

2. **Password Validation:**
   - [ ] Enter less than 6 characters → Should show error
   - [ ] Click eye icon → Password should toggle visibility
   - [ ] Password without uppercase/lowercase/number → Should show error

3. **Remember Me:**
   - [ ] Checkbox should toggle on/off

4. **Submit:**
   - [ ] Click "Sign In" → Should show loading state
   - [ ] Invalid credentials → Should show error message in red box
   - [ ] Valid credentials → Should redirect to dashboard

5. **Connect Wallet:**
   - [ ] Click "Connect Wallet" → Should trigger MetaMask popup (if installed)
   - [ ] No wallet → Should show error message

6. **Links:**
   - [ ] "Forgot Password?" → Should navigate to forgot password page
   - [ ] "Sign Up" → Should navigate to /register

---

## ✅ Register Page Testing (http://localhost:5175/register)

### Visual Elements to Verify:
- [ ] **Left Panel:**
  - [ ] DocChain logo
  - [ ] "Create Account" heading
  - [ ] Role dropdown (Student/Staff/Admin/Institution)
  - [ ] Dynamic form fields based on role selection
  - [ ] Error/success message boxes
  - [ ] "Create Account" button
  - [ ] "Sign In" link at bottom

- [ ] **Right Panel:**
  - [ ] Green background
  - [ ] Floating blob decorations
  - [ ] Device/phone mockup with:
    - [ ] Dark phone body
    - [ ] Green gradient screen
    - [ ] Concentric rings in center
    - [ ] Progress bar at bottom
    - [ ] Sun icon in screen

### Role-Specific Fields:

#### Student Role:
- [ ] First Name (alphabetic only)
- [ ] Last Name (alphabetic only)
- [ ] Student ID (alphanumeric)
- [ ] College Name (alphabetic)
- [ ] College ID (alphanumeric)
- [ ] Department dropdown
- [ ] Section dropdown
- [ ] Email
- [ ] Password (with toggle)
- [ ] Confirm Password (with toggle)
- [ ] Phone (10 digits)
- [ ] Wallet Address (optional)
- [ ] Date of Birth
- [ ] Gender dropdown
- [ ] Secret Question (optional)

#### Staff Role:
- [ ] First Name
- [ ] Last Name
- [ ] Staff ID
- [ ] College Name
- [ ] College ID
- [ ] Department
- [ ] (No Section field)
- [ ] All common fields (email, password, phone, etc.)

#### Admin Role:
- [ ] Full Name (single field, not first/last)
- [ ] Admin ID
- [ ] College Name
- [ ] College ID
- [ ] (No Department or Section)
- [ ] All common fields

#### Institution Role (3-Step Process):
**Step 1: Institution Details**
- [ ] Institution Name
- [ ] Institution ID
- [ ] Type of Institute
- [ ] Official Email
- [ ] Website
- [ ] Address (textarea)
- [ ] Password (with toggle)
- [ ] Confirm Password (with toggle)
- [ ] Phone (10-15 digits)
- [ ] "Send OTP" button

**Step 2: OTP Verification**
- [ ] OTP input field (6 digits)
- [ ] Success message after sending OTP
- [ ] "Verify OTP" button
- [ ] Back button to step 1

**Step 3: Primary Admin Creation**
- [ ] Admin Full Name
- [ ] Admin ID
- [ ] Admin Email
- [ ] Admin Phone
- [ ] Admin Password (with toggle)
- [ ] Admin Confirm Password (with toggle)
- [ ] "Create Institution & Admin" button

### Validation Testing:

1. **Email Validation:**
   - [ ] Invalid format → Error
   - [ ] Valid format → Accept

2. **Password Strength:**
   - [ ] Less than 6 chars → Error
   - [ ] No uppercase → Error
   - [ ] No lowercase → Error
   - [ ] No number → Error
   - [ ] Strong password → Accept

3. **Password Match:**
   - [ ] Password ≠ Confirm Password → Error
   - [ ] Passwords match → Accept

4. **Phone Validation:**
   - [ ] Less than 10 digits → Error
   - [ ] Non-numeric → Error
   - [ ] Exactly 10 digits → Accept

5. **Alphabetic Fields (Names, College Name):**
   - [ ] Numbers or special chars → Error
   - [ ] Only letters and spaces → Accept

6. **Alphanumeric Fields (IDs):**
   - [ ] Special characters → Error
   - [ ] Letters and numbers → Accept

7. **Numeric Fields (Institution ID):**
   - [ ] Letters or special chars → Error
   - [ ] Only numbers → Accept

8. **Required Fields:**
   - [ ] Empty required field → Error
   - [ ] All required fields filled → Accept

### localStorage Testing (Open DevTools → Application → Local Storage):

After registration:
```json
{
  "users": [
    {
      "id": 1234567890,
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "password": "Test123", // Plain text (DEV ONLY!)
      // ...other fields
    }
  ]
}
```

After login:
```json
{
  "token": "base64encodedtoken...",
  "user": { /* user object */ },
  "rememberMe": "true" // if checkbox was checked
}
```

---

## 🎨 Design Consistency Checklist

### Colors:
- [ ] Brand green: `#18a36f` (buttons, logo)
- [ ] Dark green: `#11684f` (gradients)
- [ ] Light backgrounds: `#f8fafc`, `#edf2f7`
- [ ] Text: `#0f172a` (dark), `#64748b` (muted)

### Typography:
- [ ] Font: Inter for body, Poppins for headings
- [ ] Logo "D" is bold 800 weight

### Borders & Shadows:
- [ ] Card border radius: 28px
- [ ] Input border radius: 14px
- [ ] Soft shadows on buttons and cards
- [ ] Focus ring on inputs (green glow)

### Icons:
- [ ] RemixIcon library loaded
- [ ] All icons displaying correctly (mail, lock, eye, check, wallet, etc.)

### Responsive:
- [ ] Desktop (>980px): Two columns
- [ ] Tablet/Mobile (<980px): Single column, right panel on top
- [ ] Touch-friendly tap targets

---

## 🐛 Known Issues (Development Only)

⚠️ **Security Warnings:**
- Passwords stored in plain text in localStorage
- No encryption
- Base64 token is NOT a real JWT
- No backend API calls
- For UI development/testing ONLY

⚠️ **React Router Warnings:**
- Future flag warnings are normal (v7 migration notices)
- Do not affect functionality

---

## 🔄 When Backend is Ready

1. **Switch Context:**
   ```javascript
   // In main.jsx, change:
   import { AuthProvider } from './contexts/AuthContextLocal'
   // To:
   import { AuthProvider } from './contexts/AuthContext'
   ```

2. **Restore Original AuthContext:**
   ```javascript
   // In AuthContext.jsx, remove the re-export lines and restore from git
   ```

3. **Configure API:**
   - Set backend URL in `.env`
   - Update API endpoints in `services/api.js`

4. **Test with Real Backend:**
   - Registration → POST `/api/auth/register`
   - Login → POST `/api/auth/login`
   - Logout → POST `/api/auth/logout`
   - Get User → GET `/api/auth/me`

---

## ✅ Success Criteria

- [ ] Login page matches HTML reference exactly
- [ ] Register page matches HTML reference exactly
- [ ] All 4 role types work correctly
- [ ] All validations trigger properly
- [ ] Error messages display clearly
- [ ] Success messages display after actions
- [ ] localStorage saves and retrieves data
- [ ] Login redirects to correct dashboard based on role
- [ ] MetaMask integration works
- [ ] Password toggles work
- [ ] Responsive design works on mobile
- [ ] No console errors (except future flag warnings)

---

## 📝 Test Data Examples

### Student Account:
```
Email: student@test.com
Password: Test123
First Name: John
Last Name: Doe
Student ID: CS001
College Name: Test College
College ID: TC123
Department: CSE
Section: A
Phone: 1234567890
```

### Staff Account:
```
Email: staff@test.com
Password: Staff123
First Name: Jane
Last Name: Smith
Staff ID: STF001
College Name: Test College
College ID: TC123
Department: ECE
Phone: 9876543210
```

### Admin Account:
```
Email: admin@test.com
Password: Admin123
Full Name: Robert Johnson
Admin ID: ADM001
College Name: Test College
College ID: TC123
Phone: 5555555555
```

### Institution:
```
Institution Name: Test University
Institution ID: 1001
Type: University
Email: contact@testuniv.edu
Website: https://testuniv.edu
Address: 123 University Ave, City, State 12345
Phone: 5551234567
Password: Inst123

Admin Name: Sarah Williams
Admin ID: ADM002
Admin Email: admin@testuniv.edu
Admin Phone: 5559876543
Admin Password: AdminU123
```

---

**Last Updated:** October 6, 2025
**Version:** 1.0 (localStorage Development Build)
