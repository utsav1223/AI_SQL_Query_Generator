const clerkThemeVariables = {
  colorPrimary: "var(--accent)",
  colorText: "var(--text-main)",
  colorTextSecondary: "var(--text-muted)",
  colorBackground: "var(--surface)",
  colorInputBackground: "var(--surface-soft)",
  colorInputText: "var(--text-main)",
  colorDanger: "var(--danger)",
  borderRadius: "8px"
};

const clerkLightAuthVariables = {
  colorPrimary: "#0f766e",
  colorText: "#0f172a",
  colorTextSecondary: "#64748b",
  colorBackground: "#ffffff",
  colorInputBackground: "#f8fafc",
  colorInputText: "#0f172a",
  colorDanger: "#dc2626",
  borderRadius: "8px"
};

export const clerkModalAppearance = {
  variables: clerkLightAuthVariables,
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "w-full border border-slate-200 bg-white text-slate-950 shadow-2xl",
    headerTitle: "text-slate-950",
    headerSubtitle: "text-slate-500",
    formFieldLabel: "text-slate-700",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400",
    formFieldInputShowPasswordButton: "text-slate-500 hover:text-teal-700",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-400",
    socialButtonsBlockButton:
      "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    formButtonPrimary: "bg-[#10232d] text-white hover:bg-[#0f766e]",
    footerActionText: "text-slate-500",
    footerActionLink: "text-teal-700 hover:text-teal-800",
    formFieldAction: "text-teal-700 hover:text-teal-800",
    identityPreviewText: "text-slate-700"
  }
};

export const clerkSwitcherAppearance = {
  variables: clerkThemeVariables,
  elements: {
    organizationSwitcherTrigger:
      "min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-none hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
    organizationPreviewTextContainer: "font-bold text-[var(--text-main)]",
    organizationPreviewMainIdentifier: "font-bold text-[var(--text-main)]",
    organizationPreviewSecondaryIdentifier: "text-[var(--text-muted)]",
    organizationSwitcherTriggerIcon: "text-[var(--text-muted)]",
    organizationSwitcherPopoverCard:
      "rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900",
    organizationSwitcherPopoverActionButton:
      "rounded-md font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }
};

export const clerkDashboardAppearance = {
  variables: clerkThemeVariables,
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-none",
    card: "w-full max-w-none border-0 bg-transparent shadow-none",
    navbar:
      "rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950",
    navbarButton:
      "rounded-md text-[12px] font-bold text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
    navbarButtonActive:
      "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white",
    pageScrollBox: "p-0",
    profileSection: "border-slate-200 dark:border-slate-700",
    profileSectionTitleText: "text-[var(--text-main)]",
    profileSectionContent: "text-[var(--text-muted)]",
    formFieldLabel: "text-[var(--text-main)]",
    formFieldInput:
      "border-slate-200 bg-white text-[var(--text-main)] dark:border-slate-700 dark:bg-slate-950",
    formButtonPrimary: "bg-[#10232d] text-white hover:bg-[#0f766e]",
    footerActionLink: "text-[var(--accent)] hover:text-[var(--accent-hover)]"
  }
};
