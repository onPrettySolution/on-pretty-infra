import {Request, Response} from 'express';
import TenantService from '../services/tenantService';
import {tryCatch} from "../utils/tryCatch";


export const createTenant = async (
    req: Request,
    res: Response,
): Promise<void> => {

    const claims = req.requestContext.authorizer.jwt.claims;
    const idToken = req.headers.authorization!.slice(7)
    const tenantName = req.body.tenantName;

    const {
        data: newTenant,
        error: errorCreatingNewTenant
    } = await tryCatch(TenantService.createTenant({claims, tenantName, idToken}))

    if (errorCreatingNewTenant) {
        console.error('TenantService.createTenant:', errorCreatingNewTenant);
        res.status(500).json({msg: 'ERR', data: `TenantService.createTenant: ${errorCreatingNewTenant.message}`});
        return // need to return as lambda logs "Cannot set headers after they are sent to the client"
    }
    res.json({msg: 'OK', data: newTenant});
};
