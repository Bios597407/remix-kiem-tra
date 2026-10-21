# Professional EdTech Mobile-First AI Exam Management Interface Upgrade

Implementation plan for upgrading the visual interface and user experience into a publication-grade, professional EdTech AI Exam Management Workspace, with dedicated mobile touch optimization, card accordion views for complex matrix tables, and thorough button audit—while retaining 100% of existing features, AI analyzers, matrix logic, and CV 7991 export functionality.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:

- **Confirmed Decision 1 (Scope & Feature Preservation)**: Retain 100% of existing capabilities (AI document analysis, question generation, matrix & specification calculations, K-check verifications, and standard CV 7991 Word/PDF exports). Zero feature deletion.
- **Confirmed Decision 2 (Mobile-First Matrix Accordions)**: On mobile viewports (<768px), convert wide matrix and specification data tables into responsive **Card Accordion** components to eliminate horizontal scrolling while maintaining data depth.
- **Confirmed Decision 3 (Interactive Button & Feedback Audit)**: Perform a full interactive audit ensuring every button across the app has active touch targets (≥44px on mobile), clear hover/active feedback, active loading spinners during AI calls, and explicit accessibility labels.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the application into a modern, polished SaaS workspace for Vietnamese educators to generate, refine, manage, and export standardized exams using AI.
- **Target Experience**: Seamless desktop workspace with side-by-side configuration and live preview, paired with a mobile-first touch UI featuring a bottom navigation bar, card accordions, and touch-friendly controls.
- **Key Value**: Professional aesthetic adhering to zero-pill discipline, WCAG AA contrast, responsive viewport presence, and zero broken controls.

---

## 2. User Experience & Visual Design

- **Mobile Viewport Optimization**:
  - *Bottom Action Dock*: Fixed mobile navigation bar providing 1-tap switching between **Cấu hình & Tài liệu**, **Ma trận & Nội dung Đề thi**, and **Xuất đề (Form chuẩn)**.
  - *Card Accordions for Tables*: Large multi-column matrix and specification tables render as collapsible cards on mobile, grouped by topic or section with clear indicator badges.
  - *Touch Discipline*: All buttons, selects, and toggles meet minimum 44px touch height with clean visual active states (`active:scale-[0.98]`).
- **Visual Identity & Theme**:
  - *Palette*: Clean 60-30-10 distribution — Crisp off-white canvas (`#F8FAFC`), structural cards with subtle hairline borders (`#E2E8F0`), deep slate text (`#0F172A`), and vibrant indigo/emerald primary accents (`#4F46E5`, `#059669`).
  - *Typography*: `Plus Jakarta Sans` for UI elements paired with clean mathematical font formatting for equations and expressions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mobile Card Accordion vs Horizontal Scroll**:
  - *Chosen Approach*: Card Accordions on mobile screen sizes (<768px) and full data tables on desktop (≥768px).
  - *Why*: Eliminates awkward horizontal scrolling on phones while preserving full desktop tabular productivity for teachers on laptops.
- **Decision 2: Modular Tab Switcher for Mobile**:
  - *Chosen Approach*: A bottom mobile dock that switches main workflow views without modal overlays.
  - *Why*: Reduces cognitive load and keeps primary action targets within thumb reach on mobile devices.
- **Decision 3: Universal Button State Feedback**:
  - *Chosen Approach*: Add loading spinners, disabled states, and hover feedback to all interactive triggers (AI analyze, question regenerate, export, config save).
  - *Why*: Prevents double-clicks and ensures immediate visual confirmation (<200ms) for user actions.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Workspace Layout                          │
│               (Responsive Navbar + Viewport Container)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────────┐               ┌────────────────────┐
│      Desktop Layout (≥768px)      │               │ Mobile Layout      │
│  2-Column / Split Grid Workspace  │               │ Bottom Action Dock │
└────────────────┬──────────────────┘               └─────────┬──────────┘
                 │                                            │
                 ├──────────────────────────┬─────────────────┘
                 ▼                          ▼
┌─────────────────────────────────┐┌───────────────────────────────────┐
│ Config & Document Analyzer      ││ Responsive Matrix & Question View │
│ (ConfigPanel Component)         ││ (ExamViewer & Card Accordions)    │
└────────────────┬────────────────┘└────────────────┬──────────────────┘
                 │                                  │
                 └────────────────┬─────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Standard Exam Exporter Modal                       │
│             (StandardExamExporterModal Component - CV 7991)            │
└────────────────────────────────────────────────────────────────────────┘
```

- **Component Updates**:
  - `src/App.tsx`: Integrate responsive view switcher, header branding, and bottom mobile navigation bar.
  - `src/components/ConfigPanel.tsx`: Refactor with modern SaaS card layouts, improved touch inputs, and loading state indicators.
  - `src/components/ExamViewer.tsx`: Add mobile Card Accordion rendering for matrix/specification tables and question items.
  - `src/components/StandardExamExporterModal.tsx`: Enhance mobile modal touch responsiveness and print controls.
