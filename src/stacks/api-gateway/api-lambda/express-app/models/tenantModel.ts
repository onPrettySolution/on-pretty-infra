export const tableName = process.env.BASE_TABLE_NAME

/**
 * @Tenant a Tenant in CloudFront Multi-tenant Distributions
 * @data a field to save json data todo:
 */
export interface Tenant {
  tenantName: string;
  lastModified?: number;
  data: any
}