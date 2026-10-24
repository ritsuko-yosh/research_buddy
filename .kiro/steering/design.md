---
inclusion: always
---

# Visit Ready — Design and Content Rules

These rules apply to the frontend. They sit alongside `safety.md`, which still takes precedence on every safety question.

1. **Tokens only.** Colors, fonts, radii, spacing, and motion durations come from CSS custom properties in `frontend/src/styles.css`. Components never use literal hex colors. The only exceptions are the approved artwork files, `DoorIllustration.tsx` and `BrandMark.tsx`, which the hardcoding guard lists.
2. **Motion is optional.** All transitions and animations sit inside `@media (prefers-reduced-motion: no-preference)`. They animate only `transform` and `opacity`, use the `--dur-*` and `--ease-*` tokens, and never loop.
3. **No hardcoded data or text.** Research areas, study counts, example conditions, and related-topic links come from the generated topic file built from ClinicalTrials.gov. Patient-facing text goes through `frontend/src/i18n/strings.ts` in English and Spanish. Registry terms are shown as they come and marked `lang="en"`.
4. **Text contrast.** Text on topic colors uses `--ink`. Muted text is not placed on topic backgrounds. Every text color must meet WCAG 2.2 AA (4.5:1 for body text).
5. **Fonts.** System font stacks only. Do not load fonts or other resources from third-party origins, because that sends visitors' IP addresses to those services.
6. **Research areas describe the registry, not the patient.** Nothing on the homepage may suggest that choosing an area says anything about the user's health, symptoms, or fit for a study. Do not add symptom-based or body-based browsing.
7. **Accessibility.** Full keyboard use, visible focus, works at 320px width and 200% text size, and never relies on color alone.
