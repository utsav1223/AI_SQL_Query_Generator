import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://ai-sql-frontend.onrender.com";

const defaultMeta = {
  title: "AI SQL Studio | AI SQL Query Generator",
  description:
    "AI SQL Studio helps developers generate, optimize, validate, format, and explain SQL queries with AI and saved database schema context.",
  robots: "index,follow",
  canonicalPath: "/",
};

const publicMeta = {
  "/": defaultMeta,
  "/developers": {
    title: "Developers | AI SQL Studio",
    description:
      "Meet the developers behind AI SQL Studio, an AI-powered SQL generation and optimization platform.",
    robots: "index,follow",
    canonicalPath: "/developers",
  },
};

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
}

function getRouteMeta(pathname) {
  const normalizedPath = normalizePath(pathname);

  if (publicMeta[normalizedPath]) {
    return publicMeta[normalizedPath];
  }

  return {
    title: "AI SQL Studio",
    description: defaultMeta.description,
    robots: "noindex,follow",
    canonicalPath: "/",
  };
}

function setMetaAttribute(attributeName, key, content) {
  let element = document.head.querySelector(`meta[${attributeName}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalLink(href) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(pathname);
    const canonicalUrl = `${SITE_URL}${meta.canonicalPath}`;

    document.title = meta.title;
    setCanonicalLink(canonicalUrl);
    setMetaAttribute("name", "description", meta.description);
    setMetaAttribute("name", "robots", meta.robots);
    setMetaAttribute("property", "og:title", meta.title);
    setMetaAttribute("property", "og:description", meta.description);
    setMetaAttribute("property", "og:url", canonicalUrl);
    setMetaAttribute("name", "twitter:title", meta.title);
    setMetaAttribute("name", "twitter:description", meta.description);
  }, [pathname]);

  return null;
}
