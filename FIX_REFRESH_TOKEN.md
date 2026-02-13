# Fix: Invalid Refresh Token Error

## 🔴 Error You're Seeing:
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

## ✅ Good News!
This error means **Supabase is working again!** 🎉

The problem is that you have **old/expired authentication tokens** in your browser from when Supabase was paused.

---

## 🚀 **Quick Fix (Choose ONE method):**

### **Method 1: Use the Clear Auth Tool** (Easiest ⭐)

1. **Open this page in your browser:**
   ```
   http://localhost:3000/clear-auth.html
   ```

2. **Click the "🗑️ Clear Auth Data" button**

3. **Wait for confirmation** (it will auto-redirect)

4. **Sign in again** with your credentials

**Done!** ✅

---

### **Method 2: Manual Browser Clear** (If Method 1 doesn't work)

1. **Press F12** to open browser DevTools

2. **Go to Application tab**

3. **Click "Storage" in the left sidebar**

4. **Click "Clear site data"** button

5. **Confirm** and close DevTools

6. **Refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)

7. **Sign in again**

---

### **Method 3: Console Command** (For advanced users)

1. **Press F12** to open DevTools Console

2. **Paste this code** and press Enter:

```javascript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage  
sessionStorage.clear();

// Unregister service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
});

// Clear caches
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});

console.log('✅ Auth cleared! Refresh the page.');
```

3. **Hard refresh** the page (Ctrl+Shift+R)

4. **Sign in again**

---

## 🔧 **What Changed (Automatic Fix):**

I've also added **automatic handling** for this error:

✅ The app will now **automatically detect** invalid refresh tokens
✅ It will **clear the auth state** automatically  
✅ It will **redirect you to login** with a helpful message
✅ You'll see: "⏰ Your session expired. Please sign in again."

So next time this happens, you won't even need to manually clear - just sign in again!

---

## 🎯 **Expected Result After Fix:**

1. ✅ No more "Invalid Refresh Token" errors
2. ✅ Sign in page loads clean
3. ✅ You can sign in successfully
4. ✅ App works normally

---

## ⚠️ **Note about Chrome Extension Errors:**

You might also see:
```
Unchecked runtime.lastError: Could not establish connection
```

**Ignore these** - they're from a browser extension and don't affect your app.

---

## 🆘 **Still Having Issues?**

If you still see errors after clearing auth:

1. **Check if Supabase is running:**
   - Go to: http://localhost:3000/test-supabase.html
   - Click "Test Connection"
   - Should show ✅ green

2. **Try in Incognito/Private mode:**
   - This ensures a completely clean state
   - If it works there, clear your normal browser data

3. **Check console for new errors:**
   - Press F12
   - Look for errors in the Console tab
   - Share those if you need more help

---

## 📋 **Summary:**

| Issue | Solution |
|-------|----------|
| Invalid Refresh Token | Clear auth state (use clear-auth.html tool) |
| Chrome extension errors | Ignore - not your app's problem |
| Can't sign in | Clear auth first, then try |
| Still not working | Check Supabase connection test |

---

## 🎉 Next Steps:

1. ✅ Use **http://localhost:3000/clear-auth.html** to clear auth
2. ✅ Go to **http://localhost:3000/auth** to sign in
3. ✅ Test the app!

The app will now handle these errors automatically in the future! 🚀
