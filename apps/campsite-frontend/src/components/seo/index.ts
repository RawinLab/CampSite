/**
 * SEO Components Index
 * Export all SEO-related components for easy importing
 */

export { OrganizationSchema } from './OrganizationSchema';
export { CampsiteSchema } from './CampsiteSchema';
export {
  BreadcrumbSchema,
  generateCampsiteBreadcrumbs,
  generateProvinceBreadcrumbs,
  generateSearchBreadcrumbs,
  generateTypeBreadcrumbs,
  type BreadcrumbItem,
} from './BreadcrumbSchema';
export { ReviewSchema, AggregateRatingSchema } from './ReviewSchema';
