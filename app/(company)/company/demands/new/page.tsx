import { AppShell } from "@/components/app/shell";
import { createDemandAction } from "@/lib/actions/workspace";

export default async function NewDemandPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <AppShell eyebrow="Empresa" title="Criar Demanda">
      <form action={createDemandAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Nao foi possivel criar a demanda: {params.error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold md:col-span-2">Cargo / titulo<input name="title" required className="field-input mt-2" /></label>
          <label className="text-sm font-semibold md:col-span-2">Descricao<textarea name="description" required className="field-input mt-2 min-h-28" /></label>
          <label className="text-sm font-semibold">Quantidade de vagas<input name="openings" type="number" min="1" defaultValue={1} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Escolaridade minima
            <select name="educationMinimum" className="field-input mt-2">
              <option value="fundamental">Fundamental</option>
              <option value="medio">Medio</option>
              <option value="tecnico">Tecnico</option>
              <option value="superior">Superior</option>
              <option value="pos">Pos-graduacao</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Cidade<input name="city" required className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Estado<input name="state" required maxLength={2} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Modalidade
            <select name="modality" className="field-input mt-2">
              <option value="presencial">Presencial</option>
              <option value="hibrido">Hibrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Contrato
            <select name="contractType" className="field-input mt-2">
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
              <option value="temporario">Temporario</option>
              <option value="estagio">Estagio</option>
              <option value="aprendiz">Aprendiz</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Experiencia minima em meses<input name="minimumExperienceMonths" type="number" min="0" defaultValue={0} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Habilidades tecnicas<input name="technicalSkills" placeholder="Excel, atendimento, logistica" className="field-input mt-2" /></label>
          <label className="text-sm font-semibold md:col-span-2">Cursos obrigatorios<input name="requiredCourses" placeholder="NR-10, Excel intermediario" className="field-input mt-2" /></label>
        </div>
        <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Publicar demanda interna</button>
      </form>
    </AppShell>
  );
}
