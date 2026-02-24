import express from 'express'
import userController from '../controller/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { uploadAvatar } from '../middleware/uploadMiddleware.js'

const router=express.Router()
router.post('/register', uploadAvatar.single('avatar'), userController.userRegister)
router.post('/login',userController.userLogin)
router.get('/profile', protect, userController.userProfile)
router.put('/profile/avatar', protect, uploadAvatar.single('avatar'), userController.userUpdateAvatar)
export default router