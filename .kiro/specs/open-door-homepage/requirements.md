# Requirements: Open Door homepage

Scope: a new homepage with four entry doors, an explainer, a research-area "topic garden" built from live ClinicalTrials.gov data, and the same visual style carried through the app. Safety behavior does not change.

## Safety (applies to everything below)

1. WHEN the homepage shows research areas THEN the system SHALL NOT present any area as a statement about the user's health, symptoms, or fit for a study.
2. The system SHALL NOT offer symptom-based or body-based browsing.
3. The system SHALL NOT display any eligibility verdict, match score, or "you qualify" wording.

## Data

4. WHEN the topic index is built THEN the system SHALL derive every topic, study count, example condition, and related-topic link from ClinicalTrials.gov API v2 responses, and SHALL NOT use hand-written topic or condition lists.
5. WHEN a study has no Massachusetts location THEN the system SHALL NOT count it in any topic.
6. The system SHALL exclude catch-all and symptom categories listed in a commented config file.
6a. A study with several conditions MAY appear in more than one research area, and the page SHALL say so in visible text.
6b. Research areas SHALL be assigned from a fixed list of top-level MeSH disease categories; studies matching none SHALL be grouped as "Other".
6c. The page SHALL NOT load any font or other resource from a third-party origin.
7. WHEN the topic index is missing or fails validation THEN the system SHALL show a clear unavailable message and keep condition search working.

## Homepage and navigation

8. WHEN a user activates a door THEN the system SHALL scroll to its target and move focus to a heading or input there.
9. WHEN a user selects a topic THEN the system SHALL open its details inline, and Escape or the close control SHALL close them and return focus to the topic.
10. The system SHALL offer a list view with the same data and details behavior as the garden.

## Language, text, and style

11. All user-visible text SHALL live in the i18n strings file in English and Spanish, with every English key present in Spanish.
12. Registry terms SHALL appear unchanged and be marked `lang="en"`.
13. Colors, fonts, radii, spacing, and motion durations SHALL come from CSS custom properties.
14. Topic labels and counts SHALL use the ink color, which meets at least 4.5:1 on every topic background.

## Motion and accessibility

15. All motion SHALL sit inside `prefers-reduced-motion: no-preference`, animate only transform and opacity, and never loop.
16. The page SHALL meet WCAG 2.2 AA, work at 320px width and 200% text size, and never rely on color alone.
17. The existing logo, favicon, and language accent colors SHALL be kept.
