// ---------------------------------------------------------------------------
// Site configuration — edit brand, contact, and socials in ONE place.
// ---------------------------------------------------------------------------
export const site = {
  name: 'Nyan',
  fullName: 'Nyan Linn Htet',
  role: 'Creative Producer',
  title: 'Nyan — Creative Producer',
  tagline: 'Cinematic commercials, music videos & film.',
  heroSub: 'Concept to final cut — restrained, intentional, made to be felt.',
  description:
    'Nyan is a creative producer crafting cinematic commercials, music videos and film — from concept and direction through to post.',
  url: 'https://nyanproduction.me',
  portrait: '/media/nyan-portrait.jpg',
  portraitWebp: '/media/nyan-portrait.webp',
  location: 'Yangon, Myanmar',
  // Studio phone (E.164 for the tel: link; a display version is derived in Contact).
  phone: '+959797933308',
  phoneDisplay: '+95 9 797 933 308',
  // Primary inquiry address (used for the main CTA + structured data).
  email: 'director@nyanproduction.me',
  // The team — shown in the contact section.
  contacts: [
    { name: 'Nyan Linn Htet', role: 'Director', email: 'director@nyanproduction.me' },
    { name: 'Arkar Hein', role: 'Commercial', email: 'commercial@nyanproduction.me' },
    { name: 'Zayar Bhone', role: 'Sales', email: 'sales@nyanproduction.me' },
  ],
  // Social links — leave a value empty ('') to hide that link.
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/nyan_linn_htet_aka_phoe_cho' },
    { label: 'YouTube', href: 'https://www.youtube.com/@nyanofficialchannel' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@sirnyanw' },
    { label: 'Facebook', href: 'https://www.facebook.com/deride.deride.31' },
  ],
  // Optional form endpoint (Formspree/Getform). If empty, the contact CTA uses mailto:.
  formEndpoint: '',
  // Clients shown in the About section. To show a real logo, drop a file in
  // public/media/logos/ and set `logo` to its path (e.g. '/media/logos/jinro.svg').
  // SVG or transparent PNG work best; until then a clean wordmark is shown.
  clients: [
    { name: 'Bella', logo: '/media/logos/processed/bella.png' },
    { name: 'Jinro', logo: '/media/logos/processed/jinro.png' },
    { name: "Acne's", logo: '/media/logos/processed/acnes.png' },
    { name: 'Enervon C', logo: '/media/logos/processed/enervon-c.png' },
    { name: 'Borofone', logo: '/media/logos/processed/borofone.png' },
    { name: 'Solinote', logo: '/media/logos/processed/solinote.png' },
    { name: 'Hearty Heart', logo: '/media/logos/processed/hearty-heart.png' },
    { name: 'Universal', logo: '/media/logos/processed/universal.png' },
    { name: 'Red Collagen', logo: '/media/logos/processed/red-collagen.png' },
    { name: 'C’Care', logo: '/media/logos/processed/c-care.png' },
    { name: 'Atom', logo: '/media/logos/processed/atom.png' },
    { name: 'Mamee Monster', logo: '/media/logos/processed/mamee.png' },
  ],
};

// Filter categories for the work grid (order matters).
export const categories = [
  { key: 'all', label: 'All' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'film', label: 'Film' },
  { key: 'mv', label: 'Music Video' },
  { key: 'event', label: 'Event' },
];
