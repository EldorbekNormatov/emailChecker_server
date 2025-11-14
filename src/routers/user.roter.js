import express from "express";
import { createPassword, deletePassword, getPassword, passwordUpdate } from "../controllers/passwordUser.controller.js";
import { getAdminPasswords, updateAdminPassword } from "../controllers/adminPassword.controller.js";

const router = express.Router();

router.get("/getUserPassword", getPassword);
// Password yaratish
router.post("/createUserPassword", createPassword);

// Password o'chirish
router.post("/deleteUserPassword", deletePassword);
router.post("/updateUserPassword", passwordUpdate);


router.get("/getAdminPassword", getAdminPasswords);
router.post("/updateAdminPassword", updateAdminPassword);



export default router;