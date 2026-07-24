"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ImagePlus, LoaderCircle, Pencil, Send, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import {
  createServicePostAction,
  deleteServicePostAction,
  updateServicePostAction
} from "@/lib/actions/marketplace";
import {
  SERVICE_POST_ALLOWED_TYPES,
  SERVICE_POST_MAX_IMAGE_BYTES,
  SERVICE_POST_MAX_IMAGES,
  SERVICE_POSTS_BUCKET,
  servicePostPublicUrl,
  type ServicePost
} from "@/lib/marketplace/explore";

type UploadResult = { paths: string[] } | { error: string; paths: string[] };

const fieldClass =
  "w-full rounded-2xl border border-[#CAD6E2] bg-[#F9FBFC] px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#F2811D] focus:bg-white focus:ring-4 focus:ring-[#F2811D]/10";

function validateFiles(files: File[]) {
  if (!files.length) return "Selecione pelo menos uma imagem.";
  if (files.length > SERVICE_POST_MAX_IMAGES) return `Envie no máximo ${SERVICE_POST_MAX_IMAGES} imagens.`;
  const invalidType = files.find((file) => !SERVICE_POST_ALLOWED_TYPES.includes(file.type as (typeof SERVICE_POST_ALLOWED_TYPES)[number]));
  if (invalidType) return "Use somente imagens JPG, PNG ou WEBP.";
  const oversized = files.find((file) => file.size > SERVICE_POST_MAX_IMAGE_BYTES);
  if (oversized) return "Cada imagem pode ter no máximo 8 MB.";
  return null;
}

async function uploadImages(files: File[], userId: string, providerId: string): Promise<UploadResult> {
  const validationError = validateFiles(files);
  if (validationError) return { error: validationError, paths: [] };

  const supabase = createClient();
  const uploadedPaths: string[] = [];
  for (const file of files) {
    const safeExtension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const path = `${userId}/${providerId}/${crypto.randomUUID()}/${crypto.randomUUID()}.${safeExtension}`;
    const { error } = await supabase.storage.from(SERVICE_POSTS_BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false
    });
    if (error) {
      if (uploadedPaths.length) await supabase.storage.from(SERVICE_POSTS_BUCKET).remove(uploadedPaths);
      return { error: error.message, paths: [] };
    }
    uploadedPaths.push(path);
  }
  return { paths: uploadedPaths };
}

async function removeUploaded(paths: string[]) {
  if (!paths.length) return;
  await createClient().storage.from(SERVICE_POSTS_BUCKET).remove(paths);
}

export function ServicePostManager({
  providerId,
  userId,
  initialPosts
}: {
  providerId: string;
  userId: string;
  initialPosts: ServicePost[];
}) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview)), [previews]);

  function submitPost() {
    setFeedback(null);
    startTransition(async () => {
      const uploaded = await uploadImages(files, userId, providerId);
      if ("error" in uploaded) {
        setFeedback(uploaded.error);
        return;
      }
      const result = await createServicePostAction({
        providerId,
        description,
        imagePaths: uploaded.paths
      });
      if (!result.ok) {
        await removeUploaded(uploaded.paths);
        setFeedback(result.error);
        return;
      }
      setDescription("");
      setFiles([]);
      setFeedback("Publicação criada com sucesso.");
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#D8E2EB] bg-[#FBFCFD] shadow-[0_18px_55px_rgba(15,45,78,0.08)]">
      <div className="border-b border-[#DCE5ED] bg-[linear-gradient(135deg,#0F2D4E,#173F69)] px-5 py-6 text-white sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#F2811D] shadow-[0_10px_25px_rgba(242,129,29,0.3)]">
            <ImagePlus aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFBE80]">Sua vitrine</p>
            <h2 className="text-xl font-bold">Posts dos seus trabalhos</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#DCE8F2]">
          Publique resultados reais para aparecer na área Explorar quando seu perfil estiver aprovado e já tiver avaliações.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-3xl border border-[#D8E2EB] bg-white p-5 shadow-[0_12px_32px_rgba(15,45,78,0.06)]">
          <h3 className="font-bold text-[#0F2D4E]">Nova publicação</h3>
          <label className="mt-4 block text-sm font-semibold text-[#172033]">
            Conte sobre o trabalho
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={1000}
              className={`${fieldClass} mt-2 resize-y`}
              placeholder="Explique o serviço realizado, o resultado e os principais detalhes."
            />
          </label>
          <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-[#C9D6E2] bg-[#F4F7FA] p-5 text-center transition hover:border-[#F2811D] hover:bg-[#FFF7EF] focus-within:border-[#F2811D]">
            <ImagePlus className="mx-auto text-[#F2811D]" size={28} />
            <span className="mt-2 block text-sm font-bold text-[#0F2D4E]">Selecionar até 6 imagens</span>
            <span className="mt-1 block text-xs text-[#607085]">JPG, PNG ou WEBP · máximo de 8 MB por imagem</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, SERVICE_POST_MAX_IMAGES))}
            />
          </label>
          {previews.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <img key={preview} src={preview} alt={`Prévia ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          {feedback ? (
            <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${feedback.includes("sucesso") ? "bg-[#EAF7F0] text-[#17663A]" : "bg-[#FFF0EE] text-[#A4312D]"}`}>
              {feedback}
            </p>
          ) : null}
          <button
            type="button"
            disabled={isPending || description.trim().length < 3 || files.length === 0}
            onClick={submitPost}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F2811D] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(242,129,29,0.25)] transition hover:-translate-y-0.5 hover:bg-[#DD7010] hover:shadow-[0_16px_30px_rgba(242,129,29,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
            {isPending ? "Publicando..." : "Publicar trabalho"}
          </button>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F2811D]">Publicados</p>
              <h3 className="mt-1 text-xl font-bold text-[#0F2D4E]">Sua coleção de trabalhos</h3>
            </div>
            <span className="rounded-full bg-[#E8EFF5] px-3 py-1 text-xs font-bold text-[#0F2D4E]">{initialPosts.length}</span>
          </div>
          {initialPosts.length ? (
            <div className="mt-4 space-y-4">
              {initialPosts.map((post) => (
                <EditablePostCard key={post.id} post={post} userId={userId} providerId={providerId} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-[#CAD6E2] bg-white px-6 py-10 text-center">
              <ImagePlus className="mx-auto text-[#8DA0B3]" size={30} />
              <p className="mt-3 font-bold text-[#0F2D4E]">Sua vitrine ainda está vazia</p>
              <p className="mt-1 text-sm text-[#607085]">A primeira publicação aparecerá aqui para você editar ou remover.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EditablePostCard({
  post,
  userId,
  providerId
}: {
  post: ServicePost;
  userId: string;
  providerId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(post.description);
  const [files, setFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setFeedback(null);
    startTransition(async () => {
      let paths: string[] | undefined;
      if (files.length) {
        const uploaded = await uploadImages(files, userId, providerId);
        if ("error" in uploaded) {
          setFeedback(uploaded.error);
          return;
        }
        paths = uploaded.paths;
      }
      const result = await updateServicePostAction({ postId: post.id, description, imagePaths: paths });
      if (!result.ok) {
        if (paths) await removeUploaded(paths);
        setFeedback(result.error);
        return;
      }
      setEditing(false);
      setFiles([]);
      setFeedback("Alterações salvas.");
    });
  }

  async function remove() {
    const confirmation = await Swal.fire({
      title: "Remover esta publicação?",
      text: "Ela deixará de aparecer imediatamente na área Explorar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#B42318",
      cancelButtonColor: "#0F2D4E",
      reverseButtons: true
    });
    if (!confirmation.isConfirmed) return;

    startTransition(async () => {
      const result = await deleteServicePostAction(post.id);
      if (!result.ok) {
        setFeedback(result.error);
        return;
      }
      await Swal.fire({
        title: "Publicação removida",
        icon: "success",
        confirmButtonColor: "#0F2D4E"
      });
    });
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-[#D8E2EB] bg-white shadow-[0_12px_30px_rgba(15,45,78,0.06)]">
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="relative min-h-44 bg-[#E8EFF5]">
          <img src={servicePostPublicUrl(post.images[0])} alt="" className="absolute inset-0 size-full object-cover" />
          {post.images.length > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-[#0F2D4E]/90 px-2.5 py-1 text-xs font-bold text-white">+{post.images.length - 1}</span>
          ) : null}
        </div>
        <div className="p-4">
          {editing ? (
            <>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={1000} className={fieldClass} />
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#CAD6E2] p-3 text-xs font-semibold text-[#0F2D4E] hover:border-[#F2811D]">
                <ImagePlus size={16} />
                {files.length ? `${files.length} nova(s) imagem(ns)` : "Substituir imagens (opcional)"}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, SERVICE_POST_MAX_IMAGES))} />
              </label>
            </>
          ) : (
            <>
              <p className="line-clamp-4 text-sm leading-6 text-[#405168]">{post.description}</p>
              <p className="mt-3 text-xs font-semibold text-[#7A899A]">{new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
            </>
          )}
          {feedback ? <p className="mt-2 text-xs font-semibold text-[#A4312D]">{feedback}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {editing ? (
              <>
                <button type="button" onClick={save} disabled={isPending || description.trim().length < 3} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2D4E] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {isPending ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />}Salvar
                </button>
                <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD6E2] px-3 py-2 text-xs font-bold text-[#0F2D4E]">
                  <X size={15} />Cancelar
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD6E2] px-3 py-2 text-xs font-bold text-[#0F2D4E] transition hover:border-[#F2811D] hover:text-[#C86008]">
                <Pencil size={15} />Editar
              </button>
            )}
            <button type="button" onClick={remove} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0C7C3] px-3 py-2 text-xs font-bold text-[#A4312D] transition hover:bg-[#FFF0EE] disabled:opacity-50">
              <Trash2 size={15} />Remover
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
