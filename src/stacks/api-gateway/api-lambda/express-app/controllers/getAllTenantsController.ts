import {Request, Response} from "express";
import {tryCatch} from "../utils/tryCatch";
import {createTenantService} from "../services";
import {getAllTenantsByTenantOwnerService} from "../services/getAllTenantsByTenantOwnerService";

export const getAllTenantsController = async (req: Request, res: Response): Promise<void> => {
    const claims = req.requestContext.authorizer.jwt.claims;
    const {data, error} = await tryCatch(getAllTenantsByTenantOwnerService({sub: claims.sub}))

    if (error) {
        console.error('getAllTenantsByTenantOwnerService:', error);
        res.status(500).json({msg: 'ERR', data: `getAllTenantsByTenantOwnerService: ${error.message}`});
        return // need to return as lambda logs "Cannot set headers after they are sent to the client"
    }
    res.json({msg: 'OK', data});

}