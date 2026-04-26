-- Add role column to profiles table
-- Supports student (default), company, and admin roles
alter table profiles
  add column if not exists role text default 'student'
  check (role in ('student', 'company', 'admin'));
