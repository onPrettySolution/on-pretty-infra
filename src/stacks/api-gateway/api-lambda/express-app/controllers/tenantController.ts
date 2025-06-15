import {Request, Response} from 'express';
import TenantService from '../services/tenantService';


export const createTenant = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const claims = req.requestContext.authorizer.jwt.claims;
        const idToken = req.headers.authorization!.slice(7)
        const tenantName = req.body.tenantName;
        const data = await TenantService.createTenant({claims, tenantName, idToken});

        res.json({msg: 'OK', data: data});
    } catch (error) {
        console.error('Error creating tenant: ', error);
        res.sendStatus(500); // Internal server error
    }
};
