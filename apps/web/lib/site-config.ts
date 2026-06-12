/**
 * Frontend site configuration — hardcoded, NOT from the database.
 *
 * These values are presentation/branding concerns for the public blog.
 * They are NOT managed through the CMS. Edit this file directly.
 */

export const SITE_CONFIG = {
  /** Ko-fi support link. Set to empty string to hide all support UI. */
  kofiLink: 'https://ko-fi.com/bromanceblog',
  /** Public contact email shown in the footer. */
  contactEmail: 'hello@bromance.blog',
  /** Author display name used in support CTAs. */
  authorName: 'the creator',
} as const;
