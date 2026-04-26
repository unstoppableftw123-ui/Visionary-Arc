import { supabase } from "./supabaseClient";

export async function createClass(teacherId, { name, subject, grade_level }) {
  const join_code = Math.random().toString(36).substr(2, 6).toUpperCase();

  const { data, error } = await supabase
    .from("classes")
    .insert({ teacher_id: teacherId, name, subject, grade_level, join_code })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from("classes")
    .select("*, class_members(count)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(cls => ({
    ...cls,
    member_count: cls.class_members?.[0]?.count ?? 0,
  }));
}

export async function joinClass(studentId, joinCode) {
  const { data: cls, error: findError } = await supabase
    .from("classes")
    .select("*")
    .ilike("join_code", joinCode)
    .single();

  if (findError || !cls) throw new Error("Invalid class code");

  const { data: existing } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("class_id", cls.id)
    .eq("student_id", studentId)
    .single();

  if (existing) throw new Error("Already in this class");

  const { error: insertError } = await supabase
    .from("class_members")
    .insert({ class_id: cls.id, student_id: studentId });

  if (insertError) throw insertError;
  return cls;
}

export async function getClassStudents(classId) {
  const { data, error } = await supabase
    .from("class_members")
    .select("joined_at, users(*)")
    .eq("class_id", classId);

  if (error) throw error;
  return (data || []).map(row => ({ ...row.users, joined_at: row.joined_at }));
}
