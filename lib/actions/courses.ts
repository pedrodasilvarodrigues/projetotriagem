"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";

const courseSchema = z.object({
  courseId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  category: z.string().trim().min(2),
  workloadHours: z.coerce.number().int().min(1),
  skillTags: z.string().optional(),
  videoUrl: z.string().trim().url().refine((value) => /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]{6,}/i.test(value) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(value), "video-nao-suportado"),
  status: z.enum(["draft", "published", "archived"])
});

function splitTags(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeRedirectTo(value: FormDataEntryValue | null, fallback: string) {
  const text = String(value ?? fallback);
  return text.startsWith("/") && !text.startsWith("//") ? text : fallback;
}

function parseQuiz(formData: FormData) {
  const prompts = formData.getAll("questionPrompt").map((item) => String(item).trim());
  const optionA = formData.getAll("optionA").map((item) => String(item).trim());
  const optionB = formData.getAll("optionB").map((item) => String(item).trim());
  const optionC = formData.getAll("optionC").map((item) => String(item).trim());
  const optionD = formData.getAll("optionD").map((item) => String(item).trim());
  const correctIndexes = formData.getAll("correctIndex").map((item) => Number(item));

  return prompts
    .map((prompt, index) => ({
      prompt,
      options: [optionA[index], optionB[index], optionC[index], optionD[index]].filter(Boolean),
      correctIndex: Number.isInteger(correctIndexes[index]) ? correctIndexes[index] : 0
    }))
    .filter((question) => question.prompt.length > 0 || question.options.length > 0);
}

export async function saveCourseAction(formData: FormData) {
  await requireRole("admin");
  const redirectTo = safeRedirectTo(formData.get("redirectTo"), "/admin/courses");
  const parsed = courseSchema.safeParse({
    courseId: formData.get("courseId") || "",
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    workloadHours: formData.get("workloadHours"),
    skillTags: formData.get("skillTags"),
    videoUrl: formData.get("videoUrl"),
    status: formData.get("status")
  });

  if (!parsed.success) redirect(`${redirectTo}?error=dados-invalidos`);

  const quiz = parseQuiz(formData);
  if (!parsed.data.courseId && quiz.length === 0) redirect(`${redirectTo}?error=prova-obrigatoria`);
  for (const question of quiz) {
    if (question.prompt.length < 5 || question.options.length < 2 || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      redirect(`${redirectTo}?error=prova-invalida`);
    }
  }

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    workload_hours: parsed.data.workloadHours,
    skill_tags: splitTags(parsed.data.skillTags),
    video_url: parsed.data.videoUrl,
    status: parsed.data.status,
    archived_at: parsed.data.status === "archived" ? new Date().toISOString() : null
  };

  let courseId = parsed.data.courseId || "";
  if (courseId) {
    const { count } = await supabase.from("course_attempts").select("id", { count: "exact", head: true }).eq("course_id", courseId);
    const { error } = await supabase.from("courses").update(payload).eq("id", courseId);
    if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);

    if ((count ?? 0) === 0 && quiz.length > 0) {
      await supabase.from("course_quiz_questions").delete().eq("course_id", courseId);
    } else {
      revalidatePath("/admin/courses");
      revalidatePath(`/admin/courses/${courseId}`);
      redirect(`${redirectTo}?message=curso-atualizado`);
    }
  } else {
    const { data: created, error } = await supabase
      .from("courses")
      .insert({ ...payload, created_by: userData.user.id })
      .select("id")
      .single();
    if (error || !created?.id) redirect(`${redirectTo}?error=${encodeURIComponent(error?.message ?? "curso-nao-criado")}`);
    courseId = created.id;
  }

  if (quiz.length > 0) {
    for (const [questionIndex, question] of quiz.entries()) {
      const { data: createdQuestion, error: questionError } = await supabase
        .from("course_quiz_questions")
        .insert({ course_id: courseId, prompt: question.prompt, position: questionIndex + 1 })
        .select("id")
        .single();
      if (questionError || !createdQuestion?.id) redirect(`${redirectTo}?error=${encodeURIComponent(questionError?.message ?? "pergunta-nao-criada")}`);

      const optionsPayload = question.options.map((option, optionIndex) => ({
        question_id: createdQuestion.id,
        option_text: option,
        is_correct: optionIndex === question.correctIndex,
        position: optionIndex + 1
      }));
      const { error: optionsError } = await supabase.from("course_quiz_options").insert(optionsPayload);
      if (optionsError) redirect(`${redirectTo}?error=${encodeURIComponent(optionsError.message)}`);
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(courseId ? `/admin/courses/${courseId}?message=curso-salvo` : "/admin/courses?message=curso-salvo");
}

export async function deleteCourseAction(formData: FormData) {
  await requireRole("admin");
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) redirect("/admin/courses?error=curso-invalido");

  const supabase = await createServerClient();
  const { count } = await supabase.from("course_attempts").select("id", { count: "exact", head: true }).eq("course_id", courseId);
  const hasAttempts = Number(count ?? 0) > 0;

  const result = hasAttempts
    ? await supabase.from("courses").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", courseId)
    : await supabase.from("courses").delete().eq("id", courseId);

  if (result.error) redirect(`/admin/courses?error=${encodeURIComponent(result.error.message)}`);
  revalidatePath("/admin/courses");
  redirect(`/admin/courses?message=${hasAttempts ? "curso-arquivado" : "curso-excluido"}`);
}
