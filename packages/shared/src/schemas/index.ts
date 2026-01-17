export * from './auth';
export * from './campsite';
export * from './owner-request';

// Province schemas
export {
  provinceAutocompleteQuerySchema,
  provinceSchema,
  provinceListResponseSchema,
  type ProvinceAutocompleteQuery,
  type ProvinceListResponse,
} from './province';

export * from './price';
export * from './search';

// Review schemas - only export schemas and non-conflicting types
export {
  reviewerTypeSchema,
  reviewSortBySchema,
  reportReasonSchema,
  createReviewSchema,
  reviewQuerySchema,
  reportReviewSchema,
  helpfulVoteSchema,
  hideReviewSchema,
  unhideReviewSchema,
  ownerResponseSchema,
  photoUploadSchema,
  type HelpfulVoteInput,
  type HideReviewInput,
  type UnhideReviewInput,
  type OwnerResponseInput,
} from './review';

// Wishlist schemas
export * from './wishlist';

// Admin schemas - only export schemas, types come from types/admin.ts
export {
  campsiteApprovalActionSchema,
  ownerRequestActionSchema,
  reviewModerationActionSchema,
  pendingCampsitesQuerySchema,
  ownerRequestsQuerySchema,
  reportedReviewsQuerySchema,
  adminDashboardQuerySchema,
  userSearchQuerySchema,
  updateUserRoleSchema,
  type CampsiteApprovalAction,
  type PendingCampsitesQuery,
  type OwnerRequestAction,
  type OwnerRequestsQuery,
  type ReviewModerationAction,
  type ReportedReviewsQuery,
  type AdminDashboardQuery,
  type UserSearchQuery,
  type UpdateUserRole,
} from './admin';

// Dashboard schemas
export * from './dashboard';

// Inquiry schemas - only export schemas, types come from types/inquiry.ts
export {
  inquiryStatusSchema,
  inquiryTypeSchema,
  thaiPhoneSchema,
  dateStringSchema,
  inquiryListQuerySchema,
  inquiryReplySchema,
  inquiryStatusUpdateSchema,
  createInquirySchema,
  type InquiryListQuery,
  type CreateInquirySchemaInput,
} from './inquiry';

// Photo schemas
export * from './photo';
