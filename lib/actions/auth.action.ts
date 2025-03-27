"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string): Promise<boolean> {
  console.log('[setSessionCookie] Starting to set session cookie');
  try {
    const cookieStore = await cookies();
    
    console.log('[setSessionCookie] Creating Firebase session cookie');
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000,
    });

    console.log('[setSessionCookie] Setting cookie with options:', {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: false, // FORCE FALSE IN DEVELOPMENT
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("session", sessionCookie, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: false, // Disable secure in development
      path: "/",
      sameSite: "lax",
    });
    
    return true;
  } catch (error) {
    console.error('[setSessionCookie] Failed to set session cookie:', error);
    return false;
  }
}

export async function signUp(params: SignUpParams) {
  console.log('[signUp] Starting sign up process for email:', params.email);
  const { uid, name, email } = params;

  try {
    console.log('[signUp] Checking if user exists in DB');
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      console.log('[signUp] User already exists');
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    console.log('[signUp] Saving new user to DB');
    await db.collection("users").doc(uid).set({
      name,
      email,
    });
    console.log('[signUp] User saved successfully');

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error('[signUp] Error creating user:', error);

    if (error.code === "auth/email-already-exists") {
      console.log('[signUp] Email already exists in Firebase Auth');
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  console.log('[signIn] Starting sign in process for email:', params.email);
  const { email, idToken } = params;

  try {
    console.log('[signIn] Verifying user exists in Firebase Auth');
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      console.log('[signIn] User not found in Firebase Auth');
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }
    console.log('[signIn] User found with UID:', userRecord.uid);

    console.log('[signIn] Attempting to set session cookie');
    const cookieSet = await setSessionCookie(idToken);
    if (!cookieSet) {
      console.log('[signIn] Failed to set session cookie');
      return {
        success: false,
        message: "Failed to create session. Please try again.",
      };
    }
    
    // Add this debug log
    const cookieStore = await cookies();
    const testCookie = cookieStore.get("session")?.value;
    console.log('[signIn] Session cookie exists after setting:', !!testCookie);
    console.log('[signIn] Session cookie length:', testCookie?.length);

    return {
      success: true,
      message: "Successfully signed in",
    };
  } catch (error: any) {
    console.error('[signIn] Sign-in error:', error);
    return {
      success: false,
      message: "Authentication failed. Please try again.",
    };
  }
}

export async function signOut() {
  console.log('[signOut] Starting sign out process');
  const cookieStore = cookies();
  console.log('[signOut] Deleting session cookie');
  cookieStore.delete("session");
  console.log('[signOut] Session cookie deleted');
}

export async function getCurrentUser(): Promise<User | null> {
  console.log('[getCurrentUser] Checking for current user');
  try {
    const cookieStore = await cookies(); // Add await here
    console.log('[getCurrentUser] Getting session cookie');
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      console.log('[getCurrentUser] No session cookie found');
      return null;
    }

    console.log('[getCurrentUser] Verifying session cookie');
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    console.log('[getCurrentUser] Session cookie valid for UID:', decodedClaims.uid);

    console.log('[getCurrentUser] Fetching user data from Firestore');
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();
      
    if (!userRecord.exists) {
      console.log('[getCurrentUser] User not found in Firestore');
      return null;
    }

    console.log('[getCurrentUser] User data retrieved successfully');
    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.error('[getCurrentUser] Error verifying session:', error);
    return null;
  }
}

export async function isAuthenticated() {
  console.log('[isAuthenticated] Checking authentication status');
  const user = await getCurrentUser();
  console.log('[isAuthenticated] User authenticated:', !!user);
  return !!user;
}