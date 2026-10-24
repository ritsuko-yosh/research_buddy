/**
 * Preparation card + ready-to-copy coordinator inquiry generation (brief §7.10).
 *
 * SAFETY:
 *  - The output contains NO eligibility verdict or match score.
 *  - It only groups preserved criteria by verification category and lists the
 *    questions the patient should ASK the study team.
 *  - Contact details come only from the normalized (real) data.
 *  - No patient medical information is included or transmitted; the inquiry is a
 *    template the patient fills in and sends themselves.
 */

import type { Criterion, Trial, VerificationCategory } from "../contract/types.js";

export type Lang = "en" | "es";

export interface PreparationCard {
  nctId: string;
  title: string;
  recruitmentStatus: string | null;
  sourceUrl: string;
  /** Freshness summary for the listing. */
  freshness: {
    lastRegistryUpdate: string | null;
    stale: boolean;
    note: string;
  };
  languageNote: string;
  groups: Record<VerificationCategory, Criterion[]>;
  /** Contacts the patient can reach out to (real data only). */
  contacts: Trial["contacts"];
  /** Honest disclaimers shown with the card. */
  disclaimers: string[];
}

const LABELS: Record<Lang, Record<VerificationCategory, string>> = {
  en: {
    self_answer: "You can answer",
    check_records: "Check your existing records",
    ask_study_team: "Ask the study team",
    cannot_assess: "Cannot assess from public information",
  },
  es: {
    self_answer: "Usted puede responder",
    check_records: "Revise sus registros existentes",
    ask_study_team: "Pregunte al equipo del estudio",
    cannot_assess: "No se puede evaluar con información pública",
  },
};

const DISCLAIMERS: Record<Lang, string[]> = {
  en: [
    "Visit Ready does not decide whether you qualify for this study. There is no eligibility score.",
    "Do not get new medical tests just to use this tool. Bring records you already have.",
    "A Spanish interface here does not mean the study can serve Spanish-speaking participants. Confirm with the study team.",
    "Recruitment status and contacts come from the public registry and may be out of date — verify with the study team.",
  ],
  es: [
    "Visit Ready no decide si usted califica para este estudio. No hay puntaje de elegibilidad.",
    "No se haga pruebas médicas nuevas solo para usar esta herramienta. Lleve los registros que ya tiene.",
    "Una interfaz en español aquí no significa que el estudio pueda atender a participantes de habla hispana. Confírmelo con el equipo del estudio.",
    "El estado de reclutamiento y los contactos provienen del registro público y pueden estar desactualizados; verifíquelo con el equipo del estudio.",
  ],
};

const EMPTY_GROUPS = (): Record<VerificationCategory, Criterion[]> => ({
  self_answer: [],
  check_records: [],
  ask_study_team: [],
  cannot_assess: [],
});

export function buildPreparationCard(trial: Trial, lang: Lang = "en"): PreparationCard {
  const groups = EMPTY_GROUPS();
  for (const c of trial.criteria) groups[c.category].push(c);

  const freshnessNote = trial.dataSource.stale
    ? lang === "es"
      ? "Esta ficha del registro no se ha actualizado recientemente; verifique los detalles con el equipo del estudio."
      : "This registry listing has not been updated recently; verify details with the study team."
    : lang === "es"
      ? "Ficha del registro actualizada recientemente."
      : "Registry listing updated recently.";

  return {
    nctId: trial.nctId,
    title: trial.title,
    recruitmentStatus: trial.recruitmentStatus,
    sourceUrl: trial.sourceUrl,
    freshness: {
      lastRegistryUpdate: trial.lastRegistryUpdate,
      stale: trial.dataSource.stale,
      note: freshnessNote,
    },
    languageNote: trial.languageRequirement.note,
    groups,
    contacts: trial.contacts,
    disclaimers: DISCLAIMERS[lang],
  };
}

/**
 * Generate a concise, ready-to-copy inquiry addressed to the study coordinator.
 * It lists the questions the patient should ASK — it never asserts eligibility
 * and never includes patient medical data.
 */
export function buildCoordinatorInquiry(trial: Trial, lang: Lang = "en"): string {
  const askItems = trial.criteria
    .filter((c) => c.category === "ask_study_team" || c.category === "cannot_assess")
    .slice(0, 8);

  if (lang === "es") {
    const lines: string[] = [];
    lines.push(`Asunto: Pregunta sobre el estudio ${trial.nctId}`);
    lines.push("");
    lines.push("Estimado equipo del estudio:");
    lines.push("");
    lines.push(
      `Estoy interesado/a en obtener más información sobre su estudio "${trial.title}" (${trial.nctId}). Tengo algunas preguntas antes de considerar la participación:`,
    );
    lines.push("");
    askItems.forEach((c, i) => {
      lines.push(`${i + 1}. Con respecto a: "${truncate(c.sourceText)}" — ¿me podrían aclarar este requisito?`);
    });
    lines.push("");
    lines.push("Además: ¿Qué idiomas y servicios de interpretación están disponibles para los participantes?");
    lines.push("¿El sitio está reclutando activamente en este momento?");
    lines.push("");
    lines.push("Gracias por su tiempo.");
    return lines.join("\n");
  }

  const lines: string[] = [];
  lines.push(`Subject: Question about study ${trial.nctId}`);
  lines.push("");
  lines.push("Dear study team,");
  lines.push("");
  lines.push(
    `I'm interested in learning more about your study "${trial.title}" (${trial.nctId}). I have a few questions before considering participation:`,
  );
  lines.push("");
  askItems.forEach((c, i) => {
    lines.push(`${i + 1}. Regarding: "${truncate(c.sourceText)}" — could you help me understand this requirement?`);
  });
  lines.push("");
  lines.push("Also: What languages and interpreter services are available for participants?");
  lines.push("Is the site actively recruiting at this time?");
  lines.push("");
  lines.push("Thank you for your time.");
  return lines.join("\n");
}

function truncate(s: string, max = 160): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
