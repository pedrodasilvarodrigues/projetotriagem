import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type ResumeInput = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  education: string;
  courseName: string;
  institution: string;
  completionYear: string;
  experienceCompany: string;
  experienceRole: string;
  experiencePeriod: string;
  experienceDescription: string;
  freeCourseName: string;
  freeCourseInstitution: string;
  workload: string;
  skills: string[];
};

const styles = StyleSheet.create({
  page: { padding: 42, fontSize: 10, color: "#111827", fontFamily: "Helvetica" },
  header: { borderBottom: "1px solid #d1d5db", paddingBottom: 14, marginBottom: 18 },
  name: { fontSize: 22, fontWeight: 700 },
  meta: { marginTop: 6, color: "#4b5563" },
  section: { marginBottom: 16 },
  title: { fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1d4ed8" },
  itemTitle: { fontSize: 11, fontWeight: 700 },
  text: { lineHeight: 1.5, color: "#374151" },
  pillWrap: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { border: "1px solid #d1d5db", borderRadius: 4, padding: "4 6", marginRight: 4, marginBottom: 4 }
});

function ResumeDocument({ input }: { input: ResumeInput }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{input.fullName}</Text>
          <Text style={styles.meta}>{input.email} | {input.phone} | {input.city}/{input.state}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Formação</Text>
          <Text style={styles.itemTitle}>{input.education}</Text>
          <Text style={styles.text}>{input.courseName} - {input.institution} {input.completionYear ? `(${input.completionYear})` : ""}</Text>
        </View>

        {input.experienceCompany || input.experienceRole ? (
          <View style={styles.section}>
            <Text style={styles.title}>Experiência</Text>
            <Text style={styles.itemTitle}>{input.experienceRole} - {input.experienceCompany}</Text>
            <Text style={styles.text}>{input.experiencePeriod}</Text>
            <Text style={styles.text}>{input.experienceDescription}</Text>
          </View>
        ) : null}

        {input.freeCourseName ? (
          <View style={styles.section}>
            <Text style={styles.title}>Cursos</Text>
            <Text style={styles.itemTitle}>{input.freeCourseName}</Text>
            <Text style={styles.text}>{input.freeCourseInstitution} {input.workload ? `| ${input.workload} horas` : ""}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.title}>Habilidades</Text>
          <View style={styles.pillWrap}>
            {input.skills.map((skill) => (
              <Text key={skill} style={styles.pill}>{skill}</Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateResumePdf(input: ResumeInput) {
  return renderToBuffer(<ResumeDocument input={input} />);
}

export type ResumeTemplateId = "classico" | "editorial" | "linha";

export type ProfessionalResumePdfInput = {
  template: ResumeTemplateId;
  accentColor: string;
  showSalaryExpectation: boolean;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  desiredRole: string;
  summary: string;
  educationLevel: string;
  availableInDays: number;
  educations: Array<{ level: string; institution: string; courseName: string; completedAt: string }>;
  experiences: Array<{ companyName: string; roleTitle: string; period: string; description: string }>;
  courses: Array<{ name: string; institution: string; details: string }>;
  languages: Array<{ language: string; proficiency: string }>;
  skills: Array<{ name: string; type: string; proficiency: string }>;
};

const exportStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: "#172033", fontFamily: "Helvetica" },
  pageInner: { padding: 36 },
  row: { flexDirection: "row" },
  sidebar: { width: 150, minHeight: "100%", padding: 22, color: "#172033" },
  sidebarTitle: { fontSize: 22, fontWeight: 700, marginBottom: 8 },
  sidebarText: { fontSize: 9, lineHeight: 1.5, marginBottom: 5 },
  main: { flex: 1, padding: 32 },
  header: { paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #d8dee8" },
  name: { fontSize: 25, fontWeight: 700, color: "#111827" },
  role: { marginTop: 5, fontSize: 12, color: "#394b67" },
  meta: { marginTop: 8, fontSize: 9, color: "#5d6b82" },
  section: { marginTop: 13 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: "uppercase" },
  item: { marginBottom: 8 },
  itemTitle: { fontSize: 10.5, fontWeight: 700, color: "#111827" },
  itemMeta: { marginTop: 2, fontSize: 9, color: "#64748b" },
  text: { lineHeight: 1.5, color: "#334155" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap" },
  pill: { border: "1px solid #d8dee8", borderRadius: 8, padding: "4 7", marginRight: 5, marginBottom: 5, fontSize: 9 },
  editorialBand: { padding: "24 36", marginBottom: 18 },
  timelineRow: { flexDirection: "row", marginBottom: 8 },
  timelineDot: { width: 9, height: 9, borderRadius: 99, marginTop: 2, marginRight: 9 },
  timelineLine: { width: 2, marginLeft: 3, marginRight: 13 }
});

function EmptyText({ children }: { children: React.ReactNode }) {
  return <Text style={exportStyles.text}>{children}</Text>;
}

function ExportSection({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <View style={exportStyles.section}>
      <Text style={[exportStyles.sectionTitle, { color: accentColor }]}>{title}</Text>
      {children}
    </View>
  );
}

function ContactBlock({ input }: { input: ProfessionalResumePdfInput }) {
  return (
    <View>
      <Text style={exportStyles.name}>{input.fullName}</Text>
      <Text style={exportStyles.role}>{input.desiredRole || "Objetivo profissional não informado"}</Text>
      <Text style={exportStyles.meta}>{input.email} | {input.phone || "Telefone não informado"} | {input.city}/{input.state}</Text>
    </View>
  );
}

function ResumeSections({ input, accentColor, timeline = false }: { input: ProfessionalResumePdfInput; accentColor: string; timeline?: boolean }) {
  const wrapTimeline = (children: React.ReactNode, key: string) => timeline ? (
    <View key={key} style={exportStyles.timelineRow}>
      <View>
        <View style={[exportStyles.timelineDot, { backgroundColor: accentColor }]} />
        <View style={[exportStyles.timelineLine, { backgroundColor: accentColor, minHeight: 28 }]} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  ) : <View key={key} style={exportStyles.item}>{children}</View>;

  return (
    <>
      <ExportSection title="Resumo" accentColor={accentColor}>
        <EmptyText>{input.summary || "Resumo profissional não informado."}</EmptyText>
      </ExportSection>

      <ExportSection title="Histórico acadêmico" accentColor={accentColor}>
        {input.educations.length > 0 ? input.educations.map((education, index) => wrapTimeline(
          <>
            <Text style={exportStyles.itemTitle}>{education.courseName}</Text>
            <Text style={exportStyles.itemMeta}>{education.institution} | {education.level}{education.completedAt ? ` | ${education.completedAt}` : ""}</Text>
          </>,
          `education-${index}`
        )) : <EmptyText>Nenhum histórico academico informado.</EmptyText>}
      </ExportSection>

      <ExportSection title="Experiências" accentColor={accentColor}>
        {input.experiences.length > 0 ? input.experiences.map((experience, index) => wrapTimeline(
          <>
            <Text style={exportStyles.itemTitle}>{experience.roleTitle} - {experience.companyName}</Text>
            <Text style={exportStyles.itemMeta}>{experience.period}</Text>
            <Text style={exportStyles.text}>{experience.description}</Text>
          </>,
          `experience-${index}`
        )) : <EmptyText>Nenhuma experiência informada.</EmptyText>}
      </ExportSection>

      <ExportSection title="Cursos" accentColor={accentColor}>
        {input.courses.length > 0 ? input.courses.map((course, index) => (
          <View key={`course-${index}`} style={exportStyles.item}>
            <Text style={exportStyles.itemTitle}>{course.name}</Text>
            <Text style={exportStyles.itemMeta}>{course.institution}{course.details ? ` | ${course.details}` : ""}</Text>
          </View>
        )) : <EmptyText>Nenhum curso informado.</EmptyText>}
      </ExportSection>

      <ExportSection title="Idiomas" accentColor={accentColor}>
        {input.languages.length > 0 ? input.languages.map((language, index) => (
          <View key={`language-${index}`} style={exportStyles.item}>
            <Text style={exportStyles.itemTitle}>{language.language}</Text>
            <Text style={exportStyles.itemMeta}>{language.proficiency}</Text>
          </View>
        )) : <EmptyText>Nenhum idioma informado.</EmptyText>}
      </ExportSection>

      <ExportSection title="Habilidades" accentColor={accentColor}>
        {input.skills.length > 0 ? (
          <View style={exportStyles.pillWrap}>
            {input.skills.map((skill, index) => <Text key={`skill-${index}`} style={exportStyles.pill}>{skill.name} | {skill.type} | {skill.proficiency}</Text>)}
          </View>
        ) : <EmptyText>Nenhuma habilidade informada.</EmptyText>}
      </ExportSection>
    </>
  );
}

function ProfessionalResumeDocument({ input }: { input: ProfessionalResumePdfInput }) {
  const accentColor = input.accentColor;
  const availability = input.availableInDays === 0 ? "Disponível imediatamente" : `Disponível em ${input.availableInDays} dias`;

  if (input.template === "classico") {
    return (
      <Document title={`Currículo - ${input.fullName}`}>
        <Page size="A4" style={exportStyles.page}>
          <View style={exportStyles.row}>
            <View style={[exportStyles.sidebar, { backgroundColor: accentColor }]}>
              <Text style={exportStyles.sidebarTitle}>{input.fullName}</Text>
              <Text style={exportStyles.sidebarText}>{input.desiredRole}</Text>
              <Text style={exportStyles.sidebarText}>{input.city}/{input.state}</Text>
              <Text style={exportStyles.sidebarText}>{input.email}</Text>
              <Text style={exportStyles.sidebarText}>{input.phone || "Telefone não informado"}</Text>
              <Text style={exportStyles.sidebarText}>{availability}</Text>
              <Text style={exportStyles.sidebarText}>Grau: {input.educationLevel}</Text>
              {input.showSalaryExpectation ? <Text style={exportStyles.sidebarText}>Pretensão salarial: a combinar</Text> : null}
            </View>
            <View style={exportStyles.main}>
              <ResumeSections input={input} accentColor={accentColor} />
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  if (input.template === "linha") {
    return (
      <Document title={`Currículo - ${input.fullName}`}>
        <Page size="A4" style={[exportStyles.page, exportStyles.pageInner]}>
          <View style={exportStyles.header}>
            <ContactBlock input={input} />
            <Text style={exportStyles.meta}>{availability} | Grau de instrucao: {input.educationLevel}{input.showSalaryExpectation ? " | Pretensão salarial: a combinar" : ""}</Text>
          </View>
          <ResumeSections input={input} accentColor={accentColor} timeline />
        </Page>
      </Document>
    );
  }

  return (
    <Document title={`Currículo - ${input.fullName}`}>
      <Page size="A4" style={exportStyles.page}>
        <View style={[exportStyles.editorialBand, { backgroundColor: accentColor }]}>
          <ContactBlock input={input} />
          <Text style={exportStyles.meta}>{availability} | Grau de instrucao: {input.educationLevel}{input.showSalaryExpectation ? " | Pretensão salarial: a combinar" : ""}</Text>
        </View>
        <View style={{ padding: "0 36 36" }}>
          <ResumeSections input={input} accentColor={accentColor} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateProfessionalResumePdf(input: ProfessionalResumePdfInput) {
  return renderToBuffer(<ProfessionalResumeDocument input={input} />);
}
