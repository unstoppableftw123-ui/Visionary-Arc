import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

async function insertNotification(userId: string, type: string, message: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, message });
  if (error) throw error;
}

export async function notifyScoutView(studentId: string, companyGuildName: string): Promise<void> {
  await insertNotification(
    studentId,
    'scout_view',
    `🔍 A Guild Commander viewed your profile`
  );
}

export async function notifyMissionApproved(
  userId: string,
  missionTitle: string,
  xpGained: number,
  coinsEarned: number
): Promise<void> {
  await insertNotification(
    userId,
    'mission_approved',
    `✅ Mission "${missionTitle}" approved! +${xpGained} XP, +${coinsEarned} coins`
  );
}

export async function notifyRankUp(userId: string, newRank: string): Promise<void> {
  await insertNotification(
    userId,
    'rank_up',
    `🏆 You ranked up to ${newRank}!`
  );
}

export async function notifyGuildApplication(
  companyId: string,
  applicantUsername: string
): Promise<void> {
  await insertNotification(
    companyId,
    'guild_application',
    `📋 ${applicantUsername} applied to join your guild`
  );
}
