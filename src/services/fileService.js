import { supabase } from './supabaseClient';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
];
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'mp3', 'mp4'];

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function validate(file) {
  if (file.size > MAX_SIZE) {
    throw new Error('File exceeds 10 MB limit');
  }
  const ext = getExtension(file.name);
  const typeOk = ALLOWED_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);
  if (!typeOk && !extOk) {
    throw new Error(`File type not allowed: ${file.type || ext}`);
  }
}

export async function uploadFile(userId, file) {
  validate(file);

  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error: urlError } = await supabase.storage
    .from('user-uploads')
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (urlError) throw new Error(urlError.message);

  return {
    url: data.signedUrl,
    path,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

export async function deleteFile(path) {
  const { error } = await supabase.storage
    .from('user-uploads')
    .remove([path]);

  if (error) throw new Error(error.message);
}

export async function extractTextFromPDF(file) {
  // Placeholder — real extraction (pdf-parse or similar) to be wired in a follow-up task
  return 'PDF uploaded — AI will process it';
}
