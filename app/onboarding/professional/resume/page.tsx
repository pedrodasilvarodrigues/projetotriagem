import { ErrorBanner, Field, OnboardingLayout } from "@/components/auth/onboarding-layout";
import { DateTextInput } from "@/components/forms/date-text-input";
import { InstitutionAutocomplete } from "@/components/forms/institution-autocomplete";
import { generateResumeAction, uploadResumeAction } from "@/lib/actions/onboarding";

const skills = ["Informática", "Excel", "Atendimento", "Vendas", "Administração", "TI", "Logística", "Financeiro", "Marketing", "Idiomas"];

export default async function ProfessionalResumePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <OnboardingLayout title="Currículo profissional" description="Envie seu currículo atual ou preencha os dados para gerar uma versão profissional automaticamente.">
      <ErrorBanner error={params.error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Sim, possuo currículo</h2>
          <p className="mt-2 text-sm text-slate-600">Formatos aceitos: PDF ou DOCX. Limite maximo: 5 MB.</p>
          <form action={uploadResumeAction} className="mt-5 space-y-4">
            <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              Selecione o arquivo do currículo
              <input name="resume" type="file" required accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="mt-4 w-full text-sm" />
            </label>
            <button className="w-full rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">
              Enviar currículo
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Não possuo currículo</h2>
          <p className="mt-2 text-sm text-slate-600">Preencha os campos principais para gerar uma estrutura inicial em PDF.</p>
          <form action={generateResumeAction} className="mt-5 space-y-6">
            <fieldset className="grid gap-4 md:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-slate-900 md:col-span-2">Formação</legend>
              <Field label="Escolaridade" name="education" />
              <Field label="Curso Técnico" name="technicalCourse" required={false} />
              <Field label="Graduacao" name="degree" required={false} />
              <InstitutionAutocomplete required className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" labelClassName="text-sm font-medium text-slate-800" />
              <Field label="Ano de Conclusão" name="completionYear" type="number" required={false} />
              <Field label="Curso principal" name="courseName" />
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-slate-900 md:col-span-2">Experiências</legend>
              <Field label="Empresa" name="experienceCompany" required={false} />
              <Field label="Cargo" name="experienceRole" required={false} />
              <label className="block text-sm font-medium text-slate-800">Período Inicial<DateTextInput name="experienceStart" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" /></label>
              <label className="block text-sm font-medium text-slate-800">Período Final<DateTextInput name="experienceEnd" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" /></label>
              <label className="block text-sm font-medium text-slate-800 md:col-span-2">
                Descrição
                <textarea name="experienceDescription" className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-slate-900 md:col-span-2">Cursos e certificados</legend>
              <Field label="Nome do Curso" name="freeCourseName" required={false} />
              <InstitutionAutocomplete name="freeCourseInstitution" required={false} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" labelClassName="text-sm font-medium text-slate-800" />
              <Field label="Carga Horaria" name="workload" type="number" required={false} />
              <Field label="Ano" name="courseYear" type="number" required={false} />
              <Field label="Nome do Certificado" name="certificateName" required={false} />
              <InstitutionAutocomplete name="certificateInstitution" required={false} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" labelClassName="text-sm font-medium text-slate-800" />
              <label className="block text-sm font-medium text-slate-800">Data<DateTextInput name="certificateDate" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700" /></label>
              <Field label="Arquivo opcional" name="certificateFile" type="file" required={false} />
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-slate-900">Habilidades</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {skills.map((skill) => (
                  <label key={skill} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm">
                    <input type="checkbox" name="skills" value={skill} />
                    {skill}
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="w-full rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">
              Gerar Currículo
            </button>
          </form>
        </section>
      </div>
    </OnboardingLayout>
  );
}
