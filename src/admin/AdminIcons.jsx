// Minimal stroke icons, one per sidebar section. Kept as plain inline SVG
// (no icon-library dependency) so the sidebar never breaks a build.
const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icons = {
    dashboard: (p) => <svg {...common} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
    products: (p) => <svg {...common} {...p}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>,
    categories: (p) => <svg {...common} {...p}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>,
    banner: (p) => <svg {...common} {...p}><rect x="3" y="5" width="18" height="13" rx="1.5" /><circle cx="8.5" cy="10" r="1.5" /><path d="m21 15-5-4-4 3-3-2-6 5" /></svg>,
    orders: (p) => <svg {...common} {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 8H6" /></svg>,
    estimates: (p) => <svg {...common} {...p}><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4" /><path d="M9 12h6M9 16h6" /></svg>,
    customers: (p) => <svg {...common} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M15.7 14.2c2.6.4 4.5 2.6 4.6 5.3" /></svg>,
    expenses: (p) => <svg {...common} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>,
    purchase: (p) => <svg {...common} {...p}><path d="M6 8V6a3 3 0 0 1 6 0v2" /><rect x="4" y="8" width="16" height="13" rx="1.5" /></svg>,
    taxes: (p) => <svg {...common} {...p}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M6 18 18 6" /></svg>,
    payments: (p) => <svg {...common} {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" /></svg>,
    users: (p) => <svg {...common} {...p}><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20c0-3 2.7-5.5 6-5.5S14 17 14 20" /><path d="M14.5 14.6c2.6.4 4.5 2.7 4.5 5.4" /></svg>,
    reports: (p) => <svg {...common} {...p}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2 20h20" /></svg>,
    settings: (p) => <svg {...common} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>,
}