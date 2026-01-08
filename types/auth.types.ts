export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
}

export interface OTPVerification {
    email?: string;
    phone?: string;
    otp: string;
}

export interface UserRegistration {
    email?: string;
    phone?: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    community_type: 'college' | 'common';
    // College-specific fields
    branch?: string;
    year?: string;
    roll_no?: string;
    college?: string;
    // Common-specific fields
    city?: string;
}
