INSERT INTO challenges (sponsor_name, title, description, track, reward_type, reward_value, max_slots, current_slots, required_tier, deadline)
VALUES
  ('TechBoost', 'AI Productivity Tool Sprint', 'Build an AI-powered tool that helps students save time on a daily task. The best submission wins.', 'tech-ai', 'cash', '$200', 100, 45, 'Creator', NOW() + INTERVAL '14 days'),
  ('Studio Nova', 'Brand Identity for Local Nonprofit', 'Create a complete brand identity for a real nonprofit in your area. Winner gets mentorship.', 'design-branding', 'mentorship', '3 sessions', 30, 12, 'Builder', NOW() + INTERVAL '10 days'),
  ('GreenWave', 'Social Campaign for Climate Action', 'Design and pitch a social media campaign for climate awareness targeting Gen Z.', 'social-impact', 'feature', 'Featured on our platform', 20, 8, 'Creator', NOW() + INTERVAL '5 days'),
  ('LaunchLab', 'Pitch Deck for Gen Z App', 'Create a 10-slide investor pitch deck for a fictional Gen Z productivity app.', 'business', 'cash', '$500', 50, 23, 'Pro', NOW() + INTERVAL '21 days'),
  ('MindBridge', 'Storytelling Series for Mental Health', 'Write a 3-part article series destigmatizing mental health for teens.', 'content-storytelling', 'publish', 'Published on our blog', 15, 5, 'Builder', NOW() + INTERVAL '6 days');
