# JWT Token Expiry Fix - Complete Solution
## JWT ٹوکن ایکسپائری مسئلہ کا مکمل حل

## 🔴 **Samajh Problem**

**Error:**
```
Auth error: jwt expired
UnauthorizedError: jwt expired at verifyToken
```

**Kya ho raha tha:**
- User ki JWT token expire ho jane ke baad server automatically reject kar raha tha
- User ko manually logout aur phir login karna parta tha
- Koi automatic token refresh mechanism nahi tha

---

## ✅ **Solution - Auto Token Refresh System**

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
