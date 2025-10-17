const courseController = require('../controllers/course.controllers');
const router = require('express').Router();

router.get("/popular", courseController.getPopularCourses);
router.get("/recommended", courseController.getRecommendedCourses);
router.get("/trending", courseController.getTrendingCourses);
router.post("/create", courseController.createCourse);
router.post("/enroll", courseController.enrollCourse);
router.post("/data", courseController.getCoursesData);
router.post("/search", courseController.getSearchResults);
router.get("/tag/:value", courseController.getTagResults);
router.patch("/:id/review", courseController.addReview);
router.get("/:id/edit", courseController.getEditCoursePage);
router.get("/:id/analytics", courseController.getCourseAnalyticsPage);
router.get("/:id/learn", courseController.getCourseLearnPage);
router.post("/:id/query", courseController.getQueryResponse);
router.get("/:id/data", courseController.getCourseData);
router.get("/:id/analytics_data", courseController.getCourseAnalyticsData);
router.get("/:id/pre_assessment", courseController.getPreAssessmentPage);
router.get("/:id/generate_pre_assessment", courseController.generatePreAssessment);
router.get("/:id/generate_assessment", courseController.generateAssessment);
router.get("/:id", courseController.getCoursePage);
router.patch("/:id", courseController.updateCourse);
router.delete("/:id/delete_review", courseController.deleteReview);

module.exports = router;
