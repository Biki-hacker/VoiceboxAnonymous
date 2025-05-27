import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ 
  title = 'Voicebox Anonymous - Secure Anonymous Feedback Platform',
  description = 'Empower your workforce with secure, anonymous feedback, complaints, and suggestions. Total anonymity guaranteed with advanced security features.',
  keywords = 'anonymous feedback, employee feedback, secure feedback, anonymous complaints, suggestion box, workplace feedback, anonymous messaging',
  image = '/vblogo1.webp',
  url = window.location.href,
  type = 'website',
  siteName = 'Voicebox Anonymous',
  locale = 'en_US',
  twitterCard = 'summary_large_image',
  twitterSite = '@voicebox_anon',
  twitterCreator = '@voicebox_anon',
  children 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteName,
    "url": window.location.origin,
    "description": description,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Voicebox Anonymous" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Favicon */}
      <link rel="icon" type="image/webp" href="/vblogo1.webp" />
      <link rel="apple-touch-icon" href="/vblogo1.webp" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Additional children */}
      {children}
    </Helmet>
  );
};

export default SEO;
