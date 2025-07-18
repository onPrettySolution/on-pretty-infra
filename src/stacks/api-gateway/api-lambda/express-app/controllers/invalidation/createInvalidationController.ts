import {Request, Response} from 'express';
import {createInvalidationService} from '../../services'
import {tryCatch} from "../../utils/tryCatch";


export const createInvalidationController = async (
    req: Request,
    res: Response,
): Promise<void> => {

    // const claims = req.requestContext.authorizer.jwt.claims;
    const distributionTenantId = req.body.distributionTenantId;

    const {
        data,
        error
    } = await tryCatch(createInvalidationService({distributionTenantId}))

    if (error) {
        console.error('createInvalidationService:', error);
        res.status(500).json({msg: 'ERR', data: `createInvalidationService: ${error.message}`});
        return // need to return as lambda logs "Cannot set headers after they are sent to the client"
    }
    res.json({msg: 'OK', data: data});
};
