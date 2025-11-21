# JWT Token Authorization Fix - Complete Solution
## JWT ٹوکن آتھورائزیشن مسئلہ کا مکمل حل

## 🔴 **Problems Kya The:**

### **1. JWT Token Expired Error:**
```
Auth error: jwt expired
UnauthorizedError: jwt expired at verifyToken
```

### **2. No Authorization Header Error:**
```
Auth error: No authorization header
UnauthorizedError: No authorization header
```

**Kya ho raha tha:**
- JWT tokens 7 days ke baad expire ho rahe the
- Token cookies mein properly save/retrieve nahi ho raha tha
- Authorization header requests mein missing tha
- User ko manually logout aur login karna par raha tha

---

## ✅ **Complete Solution:**

### **Part 1: Backend - Automatic Token Refresh**

#### 1. **Auth Module Update** (`championfootballerserver/src/modules/auth.ts`)

```typescript
const verifyToken = async (ctx: CustomContext) => {
  try {
    const authHeader = ctx.request.get("Authorization")
    if (!authHeader) {
      ctx.throw(401, "No authorization header")
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      ctx.throw(401, "No token provided")
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; iat: number; exp: number; };
    ctx.state.user = decoded;

    // ✨ Check if token is expiring soon (less than 1 hour)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    if (timeUntilExpiry < 3600) { // Less than 1 hour
      // Generate new token with extended expiry
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      // Send new token in response header
      ctx.set('X-New-Token', newToken);
      ctx.set('X-Token-Refreshed', 'true');
      
      console.log("🔄 Token refreshed for user:", decoded.userId);
    }

  } catch (error: any) {
    // Better error handling
    if (error.name === 'TokenExpiredError') {
      console.error("❌ JWT Expired:", error.message);
      ctx.throw(401, "jwt expired");
    } else if (error.name === 'JsonWebTokenError') {
      console.error("❌ JWT Invalid:", error.message);
      ctx.throw(401, "Invalid token");
    } else {
      console.error("Auth error:", error.message)
      ctx.throw(401, error.message || "Invalid access token")
    }
  }
}
```

---

### **Part 2: Frontend - Token Storage & Retrieval Fix**

#### 2. **Auth Storage Enhancement** (`src/lib/authStorage.ts`)

**Save Function with Debug Logging:**
```typescript
function persistAll(user: UserProfile, userData: UserDataShape, token: string): void {
  console.log('💾 Saving auth data:', { 
    userId: user.id, 
    tokenLength: token?.length,
    tokenValid: token && token.split('.').length === 3 
  });

  // Save to localStorage
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('sessionExpiry', expiryDate.toISOString());

  // Save backup bundle
  const authData: AuthData = { token, user, userData, isAuthenticated: true, ... };
  localStorage.setItem('authData', JSON.stringify(authData));
  sessionStorage.setItem('authData', JSON.stringify(authData));

  // ✨ CRITICAL: Save to cookies properly
  Cookies.set('token', token, { expires: 365, path: '/', sameSite: 'lax' });
  Cookies.set('auth_token', token, { expires: 365, path: '/', sameSite: 'lax' });
  
  // Fallback with document.cookie
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // ✨ Verify token was saved
  const savedToken = Cookies.get('token');
  console.log('✅ Token saved verification:', { 
    saved: !!savedToken, 
    matches: savedToken === token
  });
}
```

**Retrieve Function with Auto-Recovery:**
```typescript
getAuth(): AuthResult | null {
  const token = Cookies.get('token') || Cookies.get('auth_token');

  console.log('🔍 Getting auth data:', {
    hasToken: !!token,
    tokenLength: token?.length,
    cookiesAvailable: document.cookie.includes('token')
  });

  if (isAuthenticated === 'true' && user && userData) {
    if (!token) {
      console.error('❌ User authenticated but no token found in cookies!');
      // ✨ Try to recover from localStorage backup
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData) as AuthData;
        if (parsed.token) {
          console.log('✅ Recovered token from authData backup');
          // Restore to cookies
          Cookies.set('token', parsed.token, { expires: 365, path: '/' });
          return { token: parsed.token, user, userData, isAuthenticated: true };
        }
      }
    }
    return { token, user, userData, isAuthenticated: true };
  }

  // ✨ Check localStorage backup
  const local = localStorage.getItem('authData');
  if (local) {
    const parsed = JSON.parse(local) as AuthData;
    // Restore token to cookies if missing
    if (parsed.token && !Cookies.get('token')) {
      console.log('✅ Restoring token to cookies from authData');
      Cookies.set('token', parsed.token, { expires: 365, path: '/' });
    }
    return { ...parsed };
  }

  return null;
}
```

---

#### 3. **API Token Validation** (`src/lib/api.ts`)

**Token Refresh Handler:**
```typescript
function handleTokenRefresh(response: Response): void {
  const newToken = response.headers.get('X-New-Token');
  const wasRefreshed = response.headers.get('X-Token-Refreshed');
  
  if (newToken && wasRefreshed === 'true') {
    console.log('🔄 Token auto-refreshed by server');
    const decoded = decodeJwt(newToken);
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      const user = JSON.parse(existingUser);
      saveAuthSession(newToken, user, decoded.exp);
      Cookies.set('token', newToken, { expires: 7 });
      console.log('✅ New token saved automatically');
    }
  }
}
```

**API Calls with Token Validation:**
```typescript
getUserData: async (token: string) => {
  // ✨ Validate token before sending
  if (!token || token === 'undefined' || token === 'null') {
    console.error('❌ Invalid token provided');
    return { success: false, error: 'Invalid token' };
  }

  console.log('📤 Sending request with token:', {
    tokenLength: token.length,
    tokenParts: token.split('.').length
  });

  const response = await fetch(`${API_BASE_URL}/auth/data`, {
    headers: { 
      'Authorization': `Bearer ${token}`  // ✨ Proper format
    },
    credentials: 'include',
  });

  handleTokenRefresh(response);  // ✨ Check for refresh
  // ... rest of code
}

checkAuth: async () => {
  const token = Cookies.get('token') || Cookies.get('auth_token');
  
  console.log('🔍 checkAuth called:', {
    hasToken: !!token,
    cookieString: document.cookie.substring(0, 100)
  });

  if (!token || token === 'undefined') {
    console.error('❌ No valid token found');
    return { success: false, error: 'No token found' };
  }

  const response = await fetch(`${API_BASE_URL}/auth/data`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  handleTokenRefresh(response);
  // ... rest of code
}
```

---

## 🎯 **Solution Flow:**

### **Authentication Flow:**

1. **User Login/Register:**
   ```
   User submits credentials
   → Server validates & generates JWT (7 days)
   → Frontend receives token
   → Token saved to:
      - localStorage ('authData')
      - sessionStorage ('authData')  
      - Cookies ('token', 'auth_token')
      - document.cookie (fallback)
   → User redirected to /home
   ```

2. **Token Retrieval on Page Load:**
   ```
   App loads → getAuth() called
   → Check Cookies.get('token')
   → If missing, check localStorage backup
   → If found in backup, restore to cookies
   → Return token for API calls
   ```

3. **API Request with Token:**
   ```
   API call made
   → Get token from cookies/localStorage
   → Validate token (check format, not 'undefined')
   → Add 'Authorization: Bearer {token}' header
   → Send request
   → Check response for X-New-Token header
   → If present, save new token automatically
   ```

4. **Auto Token Refresh:**
   ```
   Server receives request
   → Verify token
   → Check expiry time
   → If < 1 hour remaining:
      - Generate new 7-day token
      - Send in X-New-Token header
   → Frontend detects & saves new token
   → User session continues seamlessly
   ```

---

## 📊 **Benefits:**

### ✅ **No More "No Authorization Header" Error**
- Token properly saved to multiple locations (cookies, localStorage, sessionStorage)
- Auto-recovery from localStorage if cookies are cleared
- Token validation before sending requests

### ✅ **No More "JWT Expired" Error**
- Automatic token refresh when < 1 hour remaining
- User doesn't need to logout/login manually
- Seamless session continuation

### ✅ **Better Debugging**
- Console logs at every step
- Clear error messages
- Token validation checks

### ✅ **Multiple Fallbacks**
- Cookies (primary)
- localStorage backup
- sessionStorage backup
- document.cookie fallback

---

## 🔧 **Testing Checklist:**

### **1. Token Save Test:**
```javascript
// Login karein aur console check karein:
"💾 Saving auth data: { userId: 'xxx', tokenLength: 200, tokenValid: true }"
"✅ Token saved verification: { saved: true, matches: true }"
```

### **2. Token Retrieve Test:**
```javascript
// Page refresh karein aur console check karein:
"🔍 Getting auth data: { hasToken: true, tokenLength: 200, cookiesAvailable: true }"
```

### **3. Auto Refresh Test:**
```javascript
// 1+ hour active use karein aur console check karein:
"🔄 Token auto-refreshed by server"
"✅ New token saved automatically"
```

### **4. Recovery Test:**
```javascript
// Cookies manually clear karein, page refresh karein:
"✅ Recovered token from authData backup"
"✅ Restoring token to cookies from authData"
```

---

## 🚀 **Deployment:**

```bash
# Backend
cd championfootballerserver
npm run build
pm2 restart Champion-Server

# Frontend
cd championfootballer-client
npm run build
# Deploy to Vercel/hosting
```

---

## 🎉 **Summary:**

✅ **Backend:** Auto token refresh when expiring  
✅ **Frontend:** Multi-layer token storage & recovery  
✅ **API:** Token validation & auto-update handling  
✅ **UX:** Seamless - no manual logout/login needed  
✅ **Debug:** Clear logging at every step  

**Dono errors ab fix ho gaye hain! 🚀**

### **Backend Changes (TypeScript)**

#### 1. **Auth Module Update** (`championfootballerserver/src/modules/auth.ts`)

```typescript
const verifyToken = async (ctx: CustomContext) => {
  try {
    const authHeader = ctx.request.get("Authorization")
    if (!authHeader) {
      ctx.throw(401, "No authorization header")
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      ctx.throw(401, "No token provided")
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; iat: number; exp: number; };
    ctx.state.user = decoded;

    // ✨ NEW: Check if token is expiring soon (less than 1 hour)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    if (timeUntilExpiry < 3600) { // Less than 1 hour
      // Generate new token with extended expiry
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      // Send new token in response header
      ctx.set('X-New-Token', newToken);
      ctx.set('X-Token-Refreshed', 'true');
      
      console.log("🔄 Token refreshed for user:", decoded.userId);
    }

  } catch (error: any) {
    // ✨ NEW: Better error handling
    if (error.name === 'TokenExpiredError') {
      console.error("❌ JWT Expired:", error.message);
      ctx.throw(401, "jwt expired");
    } else if (error.name === 'JsonWebTokenError') {
      console.error("❌ JWT Invalid:", error.message);
      ctx.throw(401, "Invalid token");
    } else {
      console.error("Auth error:", error.message)
      ctx.throw(401, error.message || "Invalid access token")
    }
  }
}
```

**Kya karta hai:**
- Token verify karne ke baad check karta hai ki expiry time se 1 hour ya kam remaining hai
- Agar hai to automatically new token generate karta hai (7 days validity)
- New token ko response header mein bhejta hai: `X-New-Token` aur `X-Token-Refreshed: true`

---

### **Frontend Changes (TypeScript/React)**

#### 2. **API Token Refresh Handler** (`src/lib/api.ts`)

```typescript
import { saveAuthSession, decodeJwt } from './auth';

// Token refresh handler - checks for new token in response headers
function handleTokenRefresh(response: Response): void {
  const newToken = response.headers.get('X-New-Token');
  const wasRefreshed = response.headers.get('X-Token-Refreshed');
  
  if (newToken && wasRefreshed === 'true') {
    console.log('🔄 Token auto-refreshed by server');
    
    // Decode new token to get expiry
    const decoded = decodeJwt(newToken);
    
    // Update localStorage and cookies
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      try {
        const user = JSON.parse(existingUser);
        saveAuthSession(newToken, user, decoded.exp);
        Cookies.set('token', newToken, { expires: 7 });
        console.log('✅ New token saved automatically');
      } catch (error) {
        console.error('❌ Failed to save refreshed token:', error);
      }
    }
  }
}
```

**Kya karta hai:**
- Har API response mein check karta hai ki server ne new token bheja hai ya nahi
- Agar haan, to automatically new token save kar deta hai:
  - localStorage mein
  - Cookies mein
  - Auth session mein

---

#### 3. **Auth API Functions Update**

```typescript
// getUserData function mein add kiya
getUserData: async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/data`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
    });

    // ✨ Check for token refresh
    handleTokenRefresh(response);

    const data = await response.json();
    // ... rest of code
  }
}

// checkAuth function mein bhi add kiya
checkAuth: async (): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    // ✨ Check for token refresh
    handleTokenRefresh(response);

    const data = await response.json();
    // ... rest of code
  }
}
```

---

## 🎯 **Solution Kaise Kaam Karta Hai**

### **Step-by-Step Flow:**

1. **User Login Karta Hai**
   - Server 7 days ki JWT token deta hai
   - Token localStorage aur cookies mein save hota hai

2. **User App Use Kar Raha Hai**
   - Har request mein token verify hota hai
   - Server check karta hai: "Token expiry se 1 hour remaining hai?"

3. **Token Expire Hone Wala Hai (< 1 hour)**
   - ✅ Server automatically new token generate karta hai (7 days fresh)
   - ✅ Response header mein `X-New-Token` aur `X-Token-Refreshed: true` bhejta hai
   - ✅ Frontend automatically new token detect kar ke save kar leta hai

4. **Token Already Expired Ho Gaya**
   - ❌ Server `jwt expired` error throw karta hai
   - User ko login page pe redirect kar diya jata hai

---

## 📊 **Benefits**

### ✅ **Automatic Token Refresh**
- User ko manually logout/login nahi karna parta
- Seamless experience - user ko pata bhi nahi chalega

### ✅ **Security**
- Token 7 days ke liye valid hai
- Lekin agar user app use kar raha hai to automatically renew hota hai
- Inactive users ka token expire ho jata hai

### ✅ **Better Error Handling**
- Clear error messages: "jwt expired", "Invalid token"
- Console logs for debugging

---

## 🔧 **Testing**

### **Kaise Test Karein:**

1. **Normal Flow Test:**
   ```bash
   # Login karein
   # 1-2 hours use karein
   # Console mein dekho: "🔄 Token refreshed for user: xxx"
   ```

2. **Expired Token Test:**
   ```bash
   # Token manually expire karein (JWT_SECRET change kar ke)
   # Login try karein - error dikhna chahiye
   ```

3. **Auto Refresh Test:**
   ```bash
   # Token ki expiry 1 hour se kam set karein
   # Koi bhi API call karein
   # Check karein: X-New-Token header aaya ya nahi
   ```

---

## 🚀 **Deploy Karne Ke Liye**

### **Backend (Server):**

```bash
cd championfootballerserver
npm run build
pm2 restart Champion-Server
```

### **Frontend (Client):**

```bash
cd championfootballer-client
npm run build
# Ya deploy on Vercel
```

---

## 📝 **Important Notes**

1. **Token Expiry Time:**
   - Default: 7 days
   - Change karne ke liye: `JWT_SECRET` ke saath `expiresIn` value change karein

2. **Refresh Threshold:**
   - Default: 1 hour (3600 seconds)
   - Change karne ke liye: `timeUntilExpiry < 3600` ki value change karein

3. **Security:**
   - JWT_SECRET environment variable mein store karein
   - Production mein strong secret use karein

---

## 🎉 **Summary**

✅ **Backend:** Token verify karte waqt check karta hai aur auto-refresh karta hai
✅ **Frontend:** Response headers check kar ke new token save karta hai
✅ **User Experience:** Seamless - user ko kuch karna nahi parta
✅ **Security:** Maintained - inactive users ka token expire hota hai

---

**Ab aapka JWT token expiry ka error fix ho gaya hai! 🚀**
