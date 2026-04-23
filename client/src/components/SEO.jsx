import { Helmet } from 'react-helmet-async';

// ════════════════════════════════════════════════════════════════════
// Canonical site info — change these once, reused everywhere
// ════════════════════════════════════════════════════════════════════
const SITE = {
  name:        'Goldenray Energy NZ',
  legalName:   'Goldenray Energy NZ Ltd',
  url:         'https://goldenrayenergy.co.nz',
  logo:        'https://goldenrayenergy.co.nz/logo.jpg',
  description: "New Zealand's trusted solar energy installer — residential, commercial & off-grid solar panels, batteries, inverters & EV chargers. $0-upfront finance available.",
  locale:      'en_NZ',
  country:     'NZ',
  region:      'Auckland',
  phone:       '+64-9-123-4567',
  email:       'hello@goldenrayenergy.co.nz',
  twitter:     '@goldenrayenergy',
  streetAddress: 'Level 3, 45 Queen St',
  city:        'Auckland',
  postcode:    '1010',
  foundingDate: '2018-01-01',
  priceRange:  '$$$',
};

// ════════════════════════════════════════════════════════════════════
// <SEO> — drop into any page for full title / meta / OG / Twitter / JSON-LD
// ════════════════════════════════════════════════════════════════════
export default function SEO({
  title,
  description,
  path = '/',
  image = SITE.logo,
  type = 'website',
  keywords,
  noindex = false,
  jsonLd,         // optional additional JSON-LD (array or object)
  breadcrumbs,    // array of { name, path }
}) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — Powering a Sustainable Future`;
  const url = SITE.url + path;
  const desc = description || SITE.description;

  // Breadcrumbs JSON-LD
  const breadcrumbLd = breadcrumbs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: SITE.url + (c.path || ''),
    })),
  } : null;

  const extraJsonLd = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);
  const allLd = [breadcrumbLd, ...extraJsonLd].filter(Boolean);

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-NZ" />

      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />}

      {/* ── Open Graph ── */}
      <meta property="og:type"         content={type} />
      <meta property="og:site_name"    content={SITE.name} />
      <meta property="og:title"        content={fullTitle} />
      <meta property="og:description"  content={desc} />
      <meta property="og:url"          content={url} />
      <meta property="og:image"        content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale"       content={SITE.locale} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={SITE.twitter} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={image} />

      {/* ── Geo / NZ localisation ── */}
      <meta name="geo.region"     content={`${SITE.country}-AUK`} />
      <meta name="geo.placename"  content={SITE.region} />
      <meta name="geo.position"   content="-36.848461;174.763336" />
      <meta name="ICBM"           content="-36.848461, 174.763336" />

      {allLd.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}

// ════════════════════════════════════════════════════════════════════
// Global Organization + LocalBusiness JSON-LD (rendered once at the root)
// ════════════════════════════════════════════════════════════════════
export function OrganizationLD() {
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.legalName,
      alternateName: SITE.name,
      url: SITE.url,
      logo: SITE.logo,
      description: SITE.description,
      foundingDate: SITE.foundingDate,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.streetAddress,
        addressLocality: SITE.city,
        postalCode: SITE.postcode,
        addressCountry: SITE.country,
      },
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone: SITE.phone,
        email: SITE.email,
        contactType: 'customer support',
        areaServed: 'NZ',
        availableLanguage: ['English'],
      }],
      sameAs: [
        'https://www.facebook.com/goldenrayenergy',
        'https://www.linkedin.com/company/goldenrayenergy',
        'https://www.instagram.com/goldenrayenergy',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': SITE.url + '#business',
      name: SITE.legalName,
      image: SITE.logo,
      telephone: SITE.phone,
      email: SITE.email,
      url: SITE.url,
      priceRange: SITE.priceRange,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.streetAddress,
        addressLocality: SITE.city,
        postalCode: SITE.postcode,
        addressCountry: SITE.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -36.848461,
        longitude: 174.763336,
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '18:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '13:00' },
      ],
      areaServed: { '@type': 'Country', name: 'New Zealand' },
    },
  ];
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(ld)}</script>
    </Helmet>
  );
}

// ════════════════════════════════════════════════════════════════════
// Structured-data helpers — call these to build JSON-LD payloads
// ════════════════════════════════════════════════════════════════════
export const ld = {
  faq: (items) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }),

  product: (p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.image_url,
    description: p.description,
    sku: p.sku,
    brand: { '@type': 'Brand', name: p.brand },
    offers: {
      '@type': 'Offer',
      url: `${SITE.url}/catalog`,
      priceCurrency: 'NZD',
      price: String(p.price),
      availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE.legalName },
    },
  }),

  itemList: (products) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        image: p.image_url,
        brand: { '@type': 'Brand', name: p.brand },
        offers: { '@type': 'Offer', price: p.price, priceCurrency: 'NZD' },
      },
    })),
  }),

  service: ({ name, description, category }) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    category,
    provider: { '@type': 'Organization', name: SITE.legalName, url: SITE.url },
    areaServed: { '@type': 'Country', name: 'New Zealand' },
  }),

  offer: ({ name, description, price, priceCurrency = 'NZD' }) => ({
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name,
    description,
    priceCurrency,
    price: String(price),
    seller: { '@type': 'Organization', name: SITE.legalName },
  }),
};

export { SITE };
