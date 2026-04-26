import Dexie from 'dexie';

const db = new Dexie('VisionaryAcademy');

db.version(1).stores({
  flashcard_sets: '++id, userId, title, subject, createdAt',
  flashcards: '++id, setId, front, back, difficulty',
  notes: '++id, userId, title, folder, updatedAt',
});

export default db;
