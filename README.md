# CommunityPulse

A modern, real-time web application for tracking community sentiment and managing anonymous feedback. Built with React, TypeScript, and Supabase.

## Features

### Core Features
- **User Authentication** - Secure email/password authentication with Supabase Auth
- **Anonymous Feedback Submission** - Members can submit feedback anonymously or with their identity
- **AI-Powered Sentiment Analysis** - Real-time emotion detection using Hugging Face API with fallback analysis
- **Role-Based Access Control** - Separate views for Members and Admins
- **Live Dashboard** - Real-time charts showing sentiment distribution and trends
- **Category & Date Filtering** - Filter feedback by topic, sentiment, status, or priority
- **Export Reports** - Download feedback data as CSV for offline analysis

### Additional Features
- **Real-Time Updates** - Live feedback updates using Supabase Realtime subscriptions
- **Feedback Voting** - Members can upvote issues to highlight community priorities
- **Admin Moderation Tools** - Mark feedback as Pending, In Progress, or Resolved
- **Priority Management** - Set feedback priority levels (Low, Medium, High, Urgent)
- **Priority Alerts** - Automatic visual alerts for negative sentiment spikes
- **Mobile-Responsive Design** - Optimized for phones, tablets, and desktops
- **Dark Mode Support** - User-preference-based theme switching
- **Audit Logs** - Track admin actions for transparency and compliance

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime)
- **AI/ML**: Hugging Face API for sentiment analysis
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables:

Update the `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Database is already set up with:
   - User profiles with role management
   - Feedback with sentiment tracking
   - Categories for organization
   - Voting system
   - Audit logs
   - Row Level Security (RLS) policies

4. The sentiment analysis Edge Function is deployed and ready to use.

### Creating Demo Users

To create demo users, sign up through the app with these credentials:

**Admin Account:**
- Email: admin@demo.com
- Password: admin123

**Member Account:**
- Email: member@demo.com
- Password: member123

After creating these accounts, you'll need to manually update the admin user's role in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > profiles
3. Find the admin@demo.com user
4. Change the `role` field from 'member' to 'admin'

### Running the App

```bash
npm run dev
```

The app will be available at the URL shown in your terminal.

## Project Structure

```
src/
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── AdminFeedbackList.tsx
│   ├── FeedbackForm.tsx
│   ├── FeedbackList.tsx
│   ├── MemberDashboard.tsx
│   └── SentimentChart.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and configurations
│   └── supabase.ts
├── pages/             # Page components
│   ├── Dashboard.tsx
│   └── Login.tsx
├── App.tsx            # Main app component
├── main.tsx          # App entry point
└── index.css         # Global styles

supabase/
└── functions/
    └── analyze-sentiment/   # Edge function for AI sentiment analysis
        └── index.ts
```

## Database Schema

### Tables

- **profiles** - User profiles with role assignments (admin/member)
- **categories** - Feedback categories for organization
- **feedback** - Community feedback submissions with sentiment analysis
- **votes** - Member votes on feedback items
- **audit_logs** - Admin action tracking for transparency

### Security

All tables use Row Level Security (RLS) to ensure:
- Members can only view and submit feedback
- Members can vote on any feedback
- Admins have full access to all data
- Anonymous feedback is truly anonymous
- Audit logs track all admin actions

## Features Guide

### For Members

1. **Submit Feedback**: Use the feedback form to share thoughts, concerns, or suggestions
2. **Choose Category**: Select the most appropriate category for your feedback
3. **Anonymous Option**: Toggle anonymous submission to protect your identity
4. **Vote on Feedback**: Upvote important issues to highlight community priorities
5. **View All Feedback**: Browse and filter all community feedback
6. **Dark Mode**: Toggle dark mode for comfortable viewing

### For Admins

1. **Dashboard Overview**: View real-time sentiment statistics and trends
2. **Sentiment Chart**: Visual breakdown of positive, neutral, and negative feedback
3. **Status Tracking**: Monitor pending, in-progress, and resolved feedback
4. **Moderation Tools**: Update feedback status and priority levels
5. **Filter & Sort**: Filter by sentiment, status, category, or priority
6. **Export Data**: Download feedback as CSV for external analysis
7. **Priority Alerts**: Automatic alerts when negative sentiment is high
8. **Audit Trail**: All admin actions are logged for transparency

## AI Sentiment Analysis

The application uses a Supabase Edge Function that:
- Connects to Hugging Face API for advanced sentiment analysis
- Provides fallback keyword-based analysis if API is unavailable
- Returns sentiment classification (positive, neutral, negative)
- Includes confidence scores for accuracy tracking

## Contributing

This project was built for BYU students to help communities better understand member sentiment and address concerns proactively.

## License

MIT License - feel free to use this project for your community!
Winnersworld@1985