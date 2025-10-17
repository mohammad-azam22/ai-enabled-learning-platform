const studentController = require('../controllers/student.controllers');
const router = require('express').Router();

router.get("/signup", studentController.getSignupPage);
router.post("/signup", studentController.signup);
router.get("/login", studentController.getLoginPage);
router.post("/login", studentController.login);
router.get("/logout", studentController.logout);
router.get("/:id", studentController.getDashboardPage);
router.get("/:id/data", studentController.getStudentData);
router.get("/:id/profile", studentController.getStudentProfile);
router.post("/:id/pre_assessment", studentController.submitPreAssessment);
router.post("/:id/assessment", studentController.submitAssessment);
router.patch("/:id/update_info", studentController.update_info);
router.patch("/:id/update_pwd", studentController.update_pwd);
router.post("/:id/mark_lesson", studentController.mark_lesson);
router.delete("/:id/delete_account", studentController.delete_account);

module.exports = router;
