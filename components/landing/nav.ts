/**
 * Single source of truth for the marketing-site primary navigation.
 *
 * Shared by the desktop header (SiteHeader) and the mobile drawer
 * (HomeMobileMenu) so they can't drift. All entries are REAL routes — never
 * homepage-only anchors (#jak/#produkt/#faq): the drawer renders on every
 * marketing page via SiteHeader, where in-page anchors would be dead links.
 */
export const MARKETING_NAV = [
  { label: "Jak to funguje", href: "/jak-to-funguje" },
  { label: "Ceník", href: "/cenik" },
  { label: "Jako dárek", href: "/darek" },
  { label: "Otázky", href: "/faq" },
  { label: "Náš příběh", href: "/o-nas" },
] as const;
