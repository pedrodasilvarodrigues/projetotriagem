"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, ShieldCheck } from "lucide-react";
import { recordCourseVideoProgressAction, submitCourseAttemptAction } from "@/lib/actions/courses";
import { COURSE_MAX_ATTEMPTS, COURSE_VIDEO_COMPLETION_PERCENT } from "@/lib/courses/config";

type QuizRow = {
  question_id: string;
  question_prompt: string;
  question_position: number;
  option_id: string;
  option_text: string;
  option_position: number;
};

type CourseQuizPanelProps = {
  courseId: string;
  videoUrl: string;
  quizRows: QuizRow[];
  attemptsUsed: number;
  approved: boolean;
  initialProgress: number;
};

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function youtubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  return match?.[1] ?? null;
}

export function CourseQuizPanel({ courseId, videoUrl, quizRows, attemptsUsed, approved, initialProgress }: CourseQuizPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(initialProgress);
  const lastSent = useRef(initialProgress);
  const playerElementId = `course-video-${courseId}`;
  const videoReady = progress >= COURSE_VIDEO_COMPLETION_PERCENT;
  const ytId = youtubeId(videoUrl);

  function persistProgress(position: number, duration: number, force = false) {
    if (!duration || duration <= 0) return;
    const next = Math.min(100, (position / duration) * 100);
    setProgress((current) => Math.max(current, next));
    if (!force && next - lastSent.current < 5) return;
    lastSent.current = next;
    startTransition(async () => {
      const saved = await recordCourseVideoProgressAction({ courseId, positionSeconds: position, durationSeconds: duration });
      setProgress((current) => Math.max(current, saved));
      if (saved >= COURSE_VIDEO_COMPLETION_PERCENT) router.refresh();
    });
  }

  useEffect(() => {
    if (!ytId || videoReady) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let player: { getCurrentTime(): number; getDuration(): number; destroy(): void } | undefined;
    const setup = () => {
      const YT = (window as unknown as { YT?: { Player: new (id: string, config: object) => typeof player } }).YT;
      if (!YT?.Player) return;
      player = new YT.Player(playerElementId, {
        videoId: ytId,
        playerVars: { rel: 0 },
        events: { onStateChange: (event: { data: number }) => {
          if (event.data === 1 && !interval) interval = setInterval(() => player && persistProgress(player.getCurrentTime(), player.getDuration()), 5000);
          if (event.data === 0 && player) persistProgress(player.getDuration(), player.getDuration(), true);
          if (event.data !== 1 && interval) { clearInterval(interval); interval = undefined; }
        } }
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if ((window as unknown as { YT?: unknown }).YT) setup();
    else {
      if (!existing) { const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(script); }
      const previous = (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
      (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => { previous?.(); setup(); };
    }
    return () => { if (interval) clearInterval(interval); player?.destroy(); };
  // Persist callback intentionally uses the current course identity only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, ytId, videoReady]);
  const groupedQuestions = useMemo(() => {
    const map = new Map<string, { id: string; prompt: string; position: number; options: Array<{ id: string; text: string; position: number }> }>();
    quizRows.forEach((row) => {
      const current = map.get(row.question_id) ?? { id: row.question_id, prompt: row.question_prompt, position: row.question_position, options: [] };
      current.options.push({ id: row.option_id, text: row.option_text, position: row.option_position });
      map.set(row.question_id, current);
    });
    return [...map.values()].sort((a, b) => a.position - b.position).map((question) => ({ ...question, options: question.options.sort((a, b) => a.position - b.position) }));
  }, [quizRows]);

  const attemptsRemaining = Math.max(0, COURSE_MAX_ATTEMPTS - attemptsUsed);
  const canAnswer = videoReady && !approved && attemptsRemaining > 0 && groupedQuestions.length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <PlayCircle aria-hidden="true" className="mt-1 text-[#F2811D]" size={24} />
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F2D4E]">Assista ao vídeo antes da prova</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">A prova só é liberada após marcar o vídeo como concluído. Você terá até {COURSE_MAX_ATTEMPTS} tentativas.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
          {isDirectVideo(videoUrl) ? (
            <video src={videoUrl} controls className="aspect-video w-full" onTimeUpdate={(event) => persistProgress(event.currentTarget.currentTime, event.currentTarget.duration)} onEnded={(event) => persistProgress(event.currentTarget.duration, event.currentTarget.duration, true)} />
          ) : ytId ? (
            <div id={playerElementId} className="aspect-video w-full" />
          ) : (
            <p className="p-8 text-center text-sm text-white">Formato de vídeo não compatível. Informe um link direto MP4/WEBM/OGG ou YouTube.</p>
          )}
        </div>
        <div className="mt-4"><div className="flex justify-between text-xs font-semibold text-slate-600"><span>Progresso validado</span><span>{Math.floor(progress)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-[#F2811D] transition-all" style={{ width: `${Math.min(100, progress)}%` }} /></div>{isPending ? <p className="mt-2 text-xs text-slate-500">Salvando progresso…</p> : null}</div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 rounded-2xl border border-[#F2811D]/20 bg-[#F2811D]/10 p-4 text-sm leading-6 text-slate-700">
          <strong className="block text-[#0F2D4E]">Aviso importante</strong>
          Você terá até {COURSE_MAX_ATTEMPTS} tentativas. Após a segunda, não será possível refazer este curso. O envio da prova é único e definitivo.
        </div>

        {approved ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
            <ShieldCheck aria-hidden="true" className="mb-2" size={24} />
            Você já foi aprovado neste curso. A certificação foi adicionada ao seu perfil.
          </div>
        ) : attemptsRemaining <= 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Você usou as duas tentativas. Este curso está encerrado para você.
          </div>
        ) : (
          <form action={submitCourseAttemptAction} className="space-y-5">
            <input type="hidden" name="courseId" value={courseId} />
            {groupedQuestions.map((question, index) => (
              <fieldset key={question.id} disabled={!canAnswer} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 disabled:opacity-60">
                <legend className="px-1 text-sm font-bold text-[#0F2D4E]">Pergunta {index + 1}</legend>
                <p className="mt-2 text-sm font-semibold text-slate-900">{question.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:border-[#F2811D]/40">
                      <input required type="radio" name={`question_${question.id}`} value={option.id} />
                      {option.text}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button disabled={!canAnswer} className="btn-primary rounded-xl px-5 py-3 text-sm disabled:opacity-50" type="submit">
              Enviar tentativa {attemptsUsed + 1}
            </button>
            {!videoReady ? <p className="text-sm text-slate-500">Assista a pelo menos {COURSE_VIDEO_COMPLETION_PERCENT}% do vídeo para liberar a prova.</p> : null}
          </form>
        )}
      </section>
    </div>
  );
}
