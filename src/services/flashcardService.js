import db from './offlineDB';

export async function saveSetOffline(userId, title, subject, cards) {
  const setId = await db.flashcard_sets.add({
    userId,
    title,
    subject,
    createdAt: new Date().toISOString(),
  });

  const flashcards = cards.map((c) => ({
    setId,
    front: c.front,
    back: c.back,
    difficulty: c.difficulty ?? 'medium',
  }));

  await db.flashcards.bulkAdd(flashcards);
  return setId;
}

export async function getSetsOffline(userId) {
  return db.flashcard_sets.where('userId').equals(userId).toArray();
}

export async function getSetWithCards(setId) {
  const set = await db.flashcard_sets.get(setId);
  const cards = await db.flashcards.where('setId').equals(setId).toArray();
  return { ...set, cards };
}

export async function syncSetToSupabase(set) {
  if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) return;

  try {
    const { supabase } = await import('./supabaseClient');

    const { data: setData, error: setError } = await supabase
      .from('flashcard_sets')
      .upsert({ id: set.id, user_id: set.userId, title: set.title, subject: set.subject, created_at: set.createdAt })
      .select()
      .single();

    if (setError) throw setError;

    const cards = set.cards.map((c) => ({
      set_id: setData.id,
      front: c.front,
      back: c.back,
      difficulty: c.difficulty ?? 'medium',
    }));

    const { error: cardsError } = await supabase.from('flashcards').upsert(cards);
    if (cardsError) throw cardsError;
  } catch (err) {
    console.warn('Supabase sync skipped:', err.message);
  }
}
