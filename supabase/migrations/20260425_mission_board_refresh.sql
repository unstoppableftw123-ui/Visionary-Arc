alter table missions
  add column if not exists mission_key text;

create index if not exists missions_user_type_date_idx
  on missions(user_id, type, date);
