import express from 'express';
import {createTenantController, getAllTenantsController, getTenantController} from '../controllers';

const router = express.Router();

// Routes for creating and fetching tenants
router
    .route('/')
    .post(createTenantController)
    .get(getAllTenantsController);

// Routes for report operations (get, update, delete)
router
    .route('/:tenant')
    .get(getTenantController) // Fetch a tenant
    // .put(updateReport) // Update a report
    // .delete(deleteReport); // Delete a report

// // Middleware to validate the timestamp parameter
// router.param('timestamp', (_req, _res, next, timestamp: string) => {
//     // req.report = Reports[timestamp];
//     console.debug('run timestamp middleware here', timestamp)
//     next()
// })

export default router;
