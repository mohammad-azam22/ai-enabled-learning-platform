const instructorController = require('../controllers/instructor.controllers');
const isAuthenticatedMiddleware = require('../middlewares/isAuthenticated.middleware');
const router = require('express').Router();

router.get("/signup", instructorController.getSignupPage);
router.post("/signup", instructorController.signup);
router.get("/login", instructorController.getLoginPage);
router.post("/login", instructorController.login);
router.get("/logout", isAuthenticatedMiddleware, instructorController.logout);
router.get("/:id", isAuthenticatedMiddleware, instructorController.getDashboardPage);
router.get("/:id/data", isAuthenticatedMiddleware, instructorController.getInstructorData);
router.get("/:id/profile", isAuthenticatedMiddleware, instructorController.getInstructorProfile);
router.patch("/:id/update_info", isAuthenticatedMiddleware, instructorController.update_info);
router.patch("/:id/update_pwd", isAuthenticatedMiddleware, instructorController.update_pwd);
router.patch("/:id/delete_account", isAuthenticatedMiddleware, instructorController.delete_account);
router.post("/:id/plot", isAuthenticatedMiddleware, instructorController.generate_plot);

module.exports = router;
