// Database Types
export interface User {
    id: string;
    email: string;
    phone?: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    branch?: string;
    year?: string;
    roll_no?: string;
    college?: string;
    community_type: 'college' | 'common';
    created_at: string;
}

export interface LostItem {
    id: string;
    user_id: string;
    item_name: string;
    item_category: string;
    description: string;
    purpose?: string;
    location: string;
    community: string;
    area: string;
    gps_latitude?: number;
    gps_longitude?: number;
    latitude?: number;
    longitude?: number;
    location_accuracy?: number;
    datetime_lost: string;
    owner_name: string;
    owner_gender: 'male' | 'female' | 'other';
    owner_contact: string;
    status: 'active' | 'matched' | 'returned';
    image_url?: string;
    image_embedding?: number[]; // MobileNet feature vector
    community_type: string;
    college: string;
    created_at: string;
    updated_at?: string;
}

export interface FoundItem {
    id: string;
    user_id: string;
    item_name: string;
    item_category: string;
    description: string;
    purpose?: string;
    location: string;
    community: string;
    area: string;
    gps_latitude?: number;
    gps_longitude?: number;
    latitude?: number;
    longitude?: number;
    location_accuracy?: number;
    datetime_found: string;
    finder_name: string;
    finder_gender: 'male' | 'female' | 'other';
    finder_contact: string;
    status: 'active' | 'matched' | 'returned';
    image_url?: string;
    image_embedding?: number[]; // MobileNet feature vector
    community_type: string;
    college: string;
    created_at: string;
    updated_at?: string;
}

export interface Match {
    id: string;
    lost_item_id: string;
    found_item_id: string;
    score: number;
    breakdown: MatchBreakdown;
    owner_accepted: boolean;
    finder_accepted: boolean;
    status: 'pending' | 'active' | 'completed' | 'closed' | 'rejected';
    chat_created: boolean;
    created_at: string;
    // Rewards system properties
    item_returned_at?: string;
    reward_issued?: boolean;
    reward_amount?: number;
}

export interface MatchBreakdown {
    category_score: number;
    location_score: number;
    tfidf_score: number;
    fuzzy_score: number;
    attribute_score: number;
    purpose_score: number;
    image_score: number;
    date_score: number;
    total_score: number;
}

export interface ChatMessage {
    id: string;
    match_id: string;
    sender_id: string;
    message: string;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: 'match_found' | 'match_accepted' | 'chat_opened' | 'new_message' | 'item_returned' | 'welcome';
    title: string;
    message: string;
    related_id?: string;
    read: boolean;
    created_at: string;
}

// Extended types with relations
export interface MatchWithItems extends Match {
    lost_item?: LostItem;
    found_item?: FoundItem;
}

// Combined type for displaying reports
export interface ReportItem {
    id: string;
    item_name: string;
    item_category: string;
    description: string;
    location: string;
    community: string;
    status: 'active' | 'matched' | 'returned';
    image_url?: string;
    created_at: string;
    role: 'owner' | 'finder';
    type: 'lost' | 'found';
    unreadCount?: number; // Number of unread notifications for this item
}
