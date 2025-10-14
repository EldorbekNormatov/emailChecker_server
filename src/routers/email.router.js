import { Router } from "express";
import { emailCache, getAllIgnoredEmails, getUsers, ignoreEmail, ignoredEmails, restoreEmail, serverTest, userRegister } from "../controllers/email.controller.js";

const router = Router()

router.get('/', serverTest );
router.get('/emails', emailCache );
router.get("/ignored/all", getAllIgnoredEmails); 
router.post('/ignore', ignoreEmail );
router.post('/ignored', ignoredEmails);
router.post('/restore', restoreEmail);  
router.post('/users/register', userRegister);  
router.get('/users', getUsers);  




export default router; 