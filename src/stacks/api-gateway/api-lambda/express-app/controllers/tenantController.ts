import {Request, Response} from 'express';
import TenantService from '../services/tenantService';


export const createTenant = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const username = req.requestContext.authorizer.jwt.claims.username;

        const tenantName = req.body.tenantName;
        const data = await TenantService.createTenant({username, tenantName});

        res.json({msg: 'OK', data: data});
    } catch (error) {
        console.error('Error creating report: ', error);
        res.sendStatus(500); // Internal server error
    }
};
