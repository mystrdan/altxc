import { Router } from 'express';
import { listListings, getListing, createListing, updateListing, deleteListing, getMyListings } from '../controllers/listings.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createListingSchema, updateListingSchema } from '../utils/validators';

const router = Router();

router.get('/listings', listListings);
router.get('/listings/my', requireAuth, getMyListings);
router.get('/listings/:id', getListing);
router.post('/listings', requireAuth, validateBody(createListingSchema), createListing);
router.put('/listings/:id', requireAuth, validateBody(updateListingSchema), updateListing);
router.delete('/listings/:id', requireAuth, deleteListing);

export default router;