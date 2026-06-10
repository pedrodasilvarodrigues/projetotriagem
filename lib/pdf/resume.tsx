import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

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
          <Text style={styles.title}>Formacao</Text>
          <Text style={styles.itemTitle}>{input.education}</Text>
          <Text style={styles.text}>{input.courseName} - {input.institution} {input.completionYear ? `(${input.completionYear})` : ""}</Text>
        </View>

        {input.experienceCompany || input.experienceRole ? (
          <View style={styles.section}>
            <Text style={styles.title}>Experiencia</Text>
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
  const instance = pdf(<ResumeDocument input={input} />);
  return instance.toBuffer();
}
