// Cognito logic
import {GetIdCommand} from "@aws-sdk/client-cognito-identity";
import {cognitoIdentityClient} from "../client";
import {tryCatch} from "../../../utils/tryCatch";

export const getIdentityId = async (
    idToken: string,
    claims: Record<string, string>,
    identityPoolId: string
): Promise<string> => {

    const iss = claims.iss
    const aud = claims.aud
    if (!iss || !aud) throw new Error("Make sure Authorization header contains IdToken with iss and aud");

    const provider = iss.startsWith("https://") ? iss.slice(8) : iss;

    const command = new GetIdCommand({
        IdentityPoolId: identityPoolId,
        Logins: {[provider]: idToken},
    });

    const {data, error} = await tryCatch(cognitoIdentityClient.send(command));
    if (error) throw new Error(`getIdCommandErr: ${error.message}`);
    if (!data.IdentityId) throw new Error("IdentityId is undefined");

    return data.IdentityId;
};