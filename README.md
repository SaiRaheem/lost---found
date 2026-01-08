# Lost & Found System

A full-stack Lost & Found web application with AI-powered matching, private chat, OTP authentication, and community-based dynamic forms.

## 🚀 Features

- **OTP-Based Authentication** - Email and phone OTP login with college email validation
- **AI-Powered Matching** - Intelligent matching using TF-IDF, fuzzy matching, and NLP
- **Dynamic Forms** - Community-specific forms (college vs common)
- **Private Chat** - Real-time chat between matched users
- **Notifications** - In-app notifications for matches and messages
- **Dark Mode** - Beautiful glassmorphism UI with dark/light themes
- **Mobile-First** - Responsive design optimized for mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS with custom glassmorphism theme
- **Backend**: Supabase (Database, Auth, Realtime, Storage)
- **AI/NLP**: Custom TF-IDF, fuzzy matching, synonym detection
- **Email**: SendGrid (optional)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- SendGrid account (optional, for email notifications)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SendGrid Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

#### Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  branch TEXT,
  year TEXT,
  roll_no TEXT,
  college TEXT,
  community_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost items table
CREATE TABLE lost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  community TEXT NOT NULL,
  area TEXT,
  gps_latitude DECIMAL,
  gps_longitude DECIMAL,
  datetime_lost TIMESTAMP WITH TIME ZONE NOT NULL,
  owner_name TEXT NOT NULL,
  owner_gender TEXT NOT NULL,
  owner_contact TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Found items table
CREATE TABLE found_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  community TEXT NOT NULL,
  area TEXT,
  gps_latitude DECIMAL,
  gps_longitude DECIMAL,
  datetime_found TIMESTAMP WITH TIME ZONE NOT NULL,
  finder_name TEXT NOT NULL,
  finder_gender TEXT NOT NULL,
  finder_contact TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_item_id UUID REFERENCES lost_items(id),
  found_item_id UUID REFERENCES found_items(id),
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  owner_accepted BOOLEAN DEFAULT FALSE,
  finder_accepted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  chat_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Lost items policies
CREATE POLICY "Users can read own lost items" ON lost_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create lost items" ON lost_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lost items" ON lost_items FOR UPDATE USING (auth.uid() = user_id);

-- Found items policies
CREATE POLICY "Users can read own found items" ON found_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create found items" ON found_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own found items" ON found_items FOR UPDATE USING (auth.uid() = user_id);

-- Add more policies as needed...
```

#### Storage Bucket

Create a storage bucket for item images:

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `item-images`
3. Set it to public read access
4. Configure upload policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

1. **Sign In** - Use email or phone OTP to authenticate
2. **Report Item** - Choose "I Found Something" or "I Lost Something"
3. **AI Matching** - System automatically finds potential matches (score ≥ 70)
4. **Accept Match** - Both parties must accept to open chat
5. **Chat** - Communicate privately to arrange return
6. **Mark Returned** - Owner marks item as returned to close the case

## 🎨 UI Features

- Glassmorphism design with backdrop blur
- Dark/light mode toggle
- Smooth animations and transitions
- Mobile-first responsive layout
- Filter overlay for reports
- Real-time notifications

## 🧠 AI Matching Algorithm

The matching system uses a composite scoring model (100 points total):

- **Category Match** (20 points) - Exact category match
- **Location Match** (20 points) - Location proximity
- **TF-IDF Similarity** (25 points) - Description text similarity
- **Fuzzy Matching** (10 points) - Item name similarity with typo tolerance
- **Attributes** (15 points) - Brand, color, model matching
- **Date Proximity** (10 points) - Temporal closeness

Minimum match score: **70 points**

## 📂 Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication page
│   ├── home/              # Home page
│   ├── report/            # Report item page
│   ├── my-reports/        # My reports page
│   └── report-detail/     # Report detail page
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── reports/          # Report components
│   └── ui/               # UI components
├── contexts/             # React contexts
├── services/             # Business logic
│   └── ai/              # AI matching services
├── types/               # TypeScript types
├── utils/               # Utility functions
└── styles/              # Global styles
```

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- OTP-based authentication
- Private chat (admin cannot read)
- College email validation for college communities
- HTTPS enforced in production

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SENDGRID_API_KEY` (optional)
- `SENDGRID_FROM_EMAIL` (optional)

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues or questions, please open an issue on GitHub.
