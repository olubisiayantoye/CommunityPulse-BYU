# Quick Setup Guide for CommunityPulse

## Step 1: Configure Environment Variables

Update `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under API.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Create Demo Accounts

### Option 1: Using the Supabase Dashboard

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" > "Create new user"
3. Create two users:
   - admin@demo.com (password: admin123)
   - member@demo.com (password: member123)

### Option 2: Using the App

1. Run the app: `npm run dev`
2. Click "Sign up" on the login page
3. Create the accounts with the credentials above

## Step 4: Set Admin Role

After creating the accounts:

1. Go to Supabase Dashboard > Table Editor
2. Select the `profiles` table
3. Find the row where `email = 'admin@demo.com'`
4. Change the `role` column from `'member'` to `'admin'`
5. Save the changes

## Step 5: Start Using the App

1. Sign in as admin@demo.com to access the admin dashboard
2. Sign in as member@demo.com to access the member view
3. Submit some test feedback to see the sentiment analysis in action

## Optional: Configure Hugging Face API

For enhanced sentiment analysis:

1. Create a free account at https://huggingface.co
2. Generate an API token from your settings
3. In Supabase Dashboard, go to Edge Functions
4. Add the secret: `HUGGING_FACE_API_KEY` with your token

The app will work without this using the built-in fallback sentiment analysis.

## Troubleshooting

### "Missing Supabase environment variables" error
- Double-check your `.env` file has the correct values
- Restart the dev server after changing `.env`

### Can't see admin features after signing in
- Verify the user's role is set to 'admin' in the profiles table
- Sign out and sign back in after changing the role

### Feedback not appearing
- Check browser console for errors
- Verify RLS policies are enabled in Supabase
- Make sure you're signed in

### Sentiment analysis not working
- The app uses a fallback keyword-based analysis by default
- For AI-powered analysis, configure the Hugging Face API key
- Check Edge Function logs in Supabase for errors

## Next Steps

1. Customize the categories in the database
2. Invite real users to start submitting feedback
3. Monitor the admin dashboard for trends
4. Export reports regularly for analysis
5. Adjust priorities and respond to high-priority feedback

Enjoy using CommunityPulse!
