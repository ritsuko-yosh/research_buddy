# Design: Open Door homepage

## Data flow

    ClinicalTrials.gov API v2
            |  scripts/build-topic-index.ts (paged, validated, run in deploy build)
            v
    buildTopicIndex() in src/pipeline/topics.ts  (pure, fs-free, unit and property tested)
            |
            v
    frontend/src/data/generated/topic-index.json  (committed; app works offline)
            |  isTopicIndex() runtime guard
            v
    Homepage topic garden and list view

The frontend never calls the topic API directly. The committed file is the only source of topic data.

## Grouping rule (decided)

The live API returns no `browseBranches`. Observed fields are `meshes` and `ancestors`, so the registry's own categories are unavailable.

Rule:
1. Load a fixed list of top-level MeSH disease categories from `src/pipeline/mesh-categories.ts` (for example "Cardiovascular Diseases", "Neoplasms", "Mental Disorders"). This is standard medical vocabulary, not study data.
2. For each study, match its `ancestors` terms against that list. The study joins every matching group.
3. A study with no match joins the group "Other".
4. A study can appear in more than one group. The page says so in visible text.
5. Output metadata records `groupingSource: "meshCategoryList"` and the category list version.

Counts are distinct studies per group, so a study that matches two groups is counted once in each.

## Topic computation

- Keep studies with at least one location where `state === "Massachusetts"`.
- Group key: the last ancestor term. Studies with no ancestors are not counted.
- Drop groups listed in `config.excludedBranches` (includes the symptom category).
- `studyCount`: distinct NCT IDs in the group.
- `topConditions`: MeSH condition terms ranked by distinct-study count, up to `config.maxConditionsPerTopic`.
- `sharedWith`: other topics that share at least one MeSH term, with the shared terms. Symmetric by construction.
- Sort by `studyCount` descending, then `id`. Output does not depend on input order.

## Frontend structure

- `src/components/home/HomePage.tsx` composes the sections.
- `Doors.tsx`, `Explainer.tsx`, `TopicGarden.tsx`, `TopicDetails.tsx`, `DoorIllustration.tsx`.
- Doors move focus with `scrollIntoView` and `focus()`. The existing `SearchPanel` stays unchanged, except that its preset chips come from the index.
- Garden shape: `border-radius` values chosen from a fixed list by index. Color: `var(--topic-N)` by index modulo 6.

## Tokens and contrast

- Text on topic colors uses `--ink` (`#1d2a33`), which clears 6:1 on every topic color. `--muted` (`#4f5d66`) fails on all six topic colors (2.8 to 3.7:1), so it is not used on topic backgrounds.
- Fonts: Fraunces for headings, Atkinson Hyperlegible for body, loaded with `display=swap`.

## Motion

Animates only `transform` and `opacity`, using `--dur-*` and `--ease-*` tokens inside the reduced-motion no-preference query.

## Build (decided)

- `npm run build:topics` is run once by the team. The script validates the output and writes `frontend/src/data/generated/topic-index.json`. That file is committed, so the app works offline.
- The deploy workflow is NOT changed in this iteration.
- The script never writes a partial file. On API failure it exits with an error and leaves the existing file unchanged.
- Refresh is a manual step, repeated when the team wants newer counts. The page shows the file's `generatedAt` date.

## Fonts (decided)

No external font requests. Use system font stacks: a serif stack for headings and `system-ui` for body text. Bundling an openly licensed font in the repo is a later option.

## Missing topic file

The frontend loads the topic file with `import.meta.glob`. If the file is absent, the glob returns nothing and the garden shows the unavailable message. Doors and search still work. No sample counts are shown to patients.

## Ownership and sign-off

These need Person B's agreement before they are committed:
- `src/pipeline/topics.ts` (`buildTopicIndex`, the category list, and the exclusion config)
- `scripts/build-topic-index.ts`
- the generated file `frontend/src/data/generated/topic-index.json`

The frontend work can proceed against test data in the meantime.
