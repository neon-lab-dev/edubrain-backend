import express from "express";
import { getRegisteredCourses } from "../controllers/userController.js";
import singleUpload from "../middlewares/multer.js";
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  getAssignment,
  updateAssignment,
} from "../controllers/assignmentController.js";

import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

//get all Assignments
router.route("/assignments").get(getAllAssignments);

//create Assignment
router
  .route("/createAssignment")
  .post(isAuthenticated, authorizeAdmin, singleUpload, createAssignment);

//Update, Delete, and Get Assignment
router
  .route("/assignment/:id")
  .get(getAssignment)
  .delete(isAuthenticated, authorizeAdmin, deleteAssignment)
  .put(isAuthenticated, authorizeAdmin, singleUpload, updateAssignment);

  export default router;