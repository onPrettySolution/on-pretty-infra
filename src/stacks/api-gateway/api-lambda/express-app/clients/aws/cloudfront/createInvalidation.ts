import {CreateInvalidationForDistributionTenantCommand} from "@aws-sdk/client-cloudfront";
import {tryCatch} from "../../../utils/tryCatch";
import {cloudFrontClient} from "../client";

interface createInvalidationInput {
    // The ID of the distribution tenant. ex: dt_2yq2uFYMVyIkVWU6FAZ4lw55JXz
    distributionTenantId: string;
}

export const createInvalidation = async (input: createInvalidationInput) => {

    const command = new CreateInvalidationForDistributionTenantCommand({
        InvalidationBatch: {
            Paths: {
                Quantity: 1,
                Items: ["/*"]
            },
            CallerReference: `${Date.now()}`
        },
        Id: input.distributionTenantId
    })

    const {data, error} = await tryCatch(cloudFrontClient.send(command));
    if (error) throw new Error(`CreateInvalidationForDistributionTenantCommandError: ${error.message}`);
    if (!data.Invalidation) throw new Error("Invalidation is undefined");
    if (!data.Invalidation.Id) throw new Error("Invalidation Id is undefined");
    if (!data.Invalidation.Status) throw new Error("Invalidation Status is undefined");
    return {
        invalidationId: data.Invalidation.Id,
        invalidationStatus: data.Invalidation.Status
    }

}