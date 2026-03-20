-- Sample Data for CommunityPulse
-- This script adds sample feedback to help you test the application
-- Run this AFTER creating your demo accounts (admin@demo.com and member@demo.com)

-- Note: You'll need to replace the UUID values below with actual user IDs from your auth.users table
-- To get user IDs, run: SELECT id, email FROM auth.users;

-- Insert sample feedback (replace 'your-user-id-here' with actual user IDs)
INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'The new community center is fantastic! Great job on the renovations.',
  (SELECT id FROM categories WHERE name = 'Facilities'),
  'positive',
  0.92,
  'resolved',
  false,
  'low',
  5
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%community center is fantastic%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'We need better communication about upcoming events. I always find out about things too late.',
  (SELECT id FROM categories WHERE name = 'Communication'),
  'negative',
  0.78,
  'in_progress',
  true,
  'high',
  12
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%better communication about upcoming events%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'The last community gathering was well organized. Would love to see more events like this.',
  (SELECT id FROM categories WHERE name = 'Events'),
  'positive',
  0.88,
  'resolved',
  false,
  'medium',
  8
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%last community gathering was well organized%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'Parking situation is becoming really difficult. We desperately need more parking spaces.',
  (SELECT id FROM categories WHERE name = 'Facilities'),
  'negative',
  0.85,
  'pending',
  true,
  'urgent',
  23
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%Parking situation is becoming really difficult%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'Could we get a monthly newsletter? It would help everyone stay informed.',
  (SELECT id FROM categories WHERE name = 'Communication'),
  'neutral',
  0.55,
  'pending',
  true,
  'medium',
  7
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%Could we get a monthly newsletter%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'The leadership team has been very responsive to our concerns. Really appreciate the effort!',
  (SELECT id FROM categories WHERE name = 'Leadership'),
  'positive',
  0.95,
  'resolved',
  false,
  'low',
  15
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%leadership team has been very responsive%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'I feel like our community culture has improved significantly over the past year. People are friendlier and more engaged.',
  (SELECT id FROM categories WHERE name = 'Culture'),
  'positive',
  0.90,
  'resolved',
  false,
  'low',
  10
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%community culture has improved significantly%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'The gym equipment needs maintenance. Several machines have been broken for weeks.',
  (SELECT id FROM categories WHERE name = 'Facilities'),
  'negative',
  0.75,
  'in_progress',
  true,
  'high',
  18
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%gym equipment needs maintenance%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'Would be nice to have more family-friendly events on weekends.',
  (SELECT id FROM categories WHERE name = 'Events'),
  'neutral',
  0.60,
  'pending',
  true,
  'medium',
  9
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%more family-friendly events%');

INSERT INTO feedback (content, category_id, sentiment, sentiment_score, status, is_anonymous, priority, votes_count)
SELECT
  'Thank you for listening to our feedback. It makes a real difference!',
  (SELECT id FROM categories WHERE name = 'Leadership'),
  'positive',
  0.93,
  'resolved',
  false,
  'low',
  14
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE content LIKE '%Thank you for listening to our feedback%');
