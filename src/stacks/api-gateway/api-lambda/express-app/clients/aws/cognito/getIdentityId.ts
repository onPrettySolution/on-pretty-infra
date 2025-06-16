// Cognito logic
import {GetIdCommand} from "@aws-sdk/client-cognito-identity";
import {cognitoIdentityClient} from "../client";
import {tryCatch} from "../../../utils/tryCatch";

interface getIdentityIdInput {
    // JWT id token with aud and iss
    idToken: string,
    // iss, aud, etc
    claims: Record<string, string>,
    // Cognito Identity Pool ID, ex: us-east-1:2037428b-e67b-4fa9-b157-01eb505359f0
    identityPoolId: string
}

export const getIdentityId = async (input: getIdentityIdInput): Promise<string> => {
    const iss = input.claims.iss
    const aud = input.claims.aud
    if (!iss || !aud) throw new Error("Make sure Authorization header contains IdToken with iss and aud");

    const provider = iss.startsWith("https://") ? iss.slice(8) : iss;

    const command = new GetIdCommand({
        IdentityPoolId: input.identityPoolId,
        Logins: {[provider]: input.idToken},
    });

    const {data, error} = await tryCatch(cognitoIdentityClient.send(command));
    if (error) throw new Error(`getIdCommandErr: ${error.message}`);
    if (!data.IdentityId) throw new Error("IdentityId is undefined");

    return data.IdentityId;
};