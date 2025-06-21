import { z } from "zod";
/**
 * @Tenant a Tenant in CloudFront Multi-tenant Distributions
 * @data a field to save json data todo:
 */
// export interface Tenant {
//     // tenant01 in tenant01.on.prettysolution.com
//     tenantName: string;
//     // optional
//     lastModified?: number;
//     /** example:
//      * {
//      *   "distributionEndpoint": "d1fu2it2pa9bwt.cloudfront.net",
//      *   "DistributionId": "E18GDWUAFG5IU8",
//      *   "Domains": [{
//      *     "Domain": "tenant01.on.stage.prettysolution.com",
//      *     "Status": "active"
//      *    }],
//      *   "Name": "tenant01",
//      *   "tenantOwnerIdentityId": "us-east-1:40a8a2af-cf8a-cd5c-2bbe-76556903e1ae",
//      *   "tenantOwnerSub": "54086488-d0c1-7033-1885-427fecc6ac80"
//      *  }
//      */
//     data: any
// }

export interface TenantOwner {
    // sub from JWT token, ex: 54086488-d0c1-7033-1885-427fecc6ac80
    sub: string
    // identity id from Cognito Identity pool, ex: us-east-1:40a8a2af-cf8a-cd5c-2bbe-76556903e1ae
    identityId: string
    // ex: tenant01 in tenant01.on.prettysolution.com
    tenantName: string
}

export enum TENANT_ENTITIES {
    TENANT_OWNER = 'TENANT_OWNER',
    TENANT = 'TENANT',
}

export const DomainEntrySchema = z.object({
    Domain: z.string(),
    Status: z.string(), // or z.enum(["active", "inactive"]) if status is known
});

export const TenantDataSchema = z.object({
    distributionEndpoint: z.string(),
    distributionId: z.string(),
    domains: z.array(DomainEntrySchema),
    name: z.string(),
    tenantOwnerIdentityId: z.string(),
    tenantOwnerSub: z.string(),
});
export const TenantSchema = z.object({
    tenantName: z.string(),
    lastModified: z.number().optional(),
    data: TenantDataSchema,
});

export type Tenant = z.infer<typeof TenantSchema>;
export type DomainEntry = z.infer<typeof DomainEntrySchema>;
export type TenantData = z.infer<typeof TenantDataSchema>;

