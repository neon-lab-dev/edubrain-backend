import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Assignment } from "../models/Assignment.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import { uploadFile, deleteFile, getSignedURL } from "../utils/fileStorage.js";

//get all  Assignments--user
export const getAllAssignments = catchAsyncError(async (req, res, next) => {
  const assignments = await Assignment.find();
  res.status(200).json({
    success: true,
    assignments,
  });
});

//create Assignment
export const createAssignment = catchAsyncError(async (req, res, next) => {
  const { assignment_name, questions } = req.body;
  if (!assignment_name || !questions)
    return next(new ErrorHandler("Please add all fields", 400));

  const file = req.files["file"]?(req.files["file"][0]):null;
  const uniqueFilename = file?(`${Date.now()}_${file.originalname}`):null;
  const s3Response = file?(await uploadFile(
    { ...file, filename: uniqueFilename },
    "assignments"
  )):null;

  await Assignment.create({
    assignment_name,
    questions,
    file_details: file?{
      fileName: file.originalname,
      fileSize: file.size,
      fileKey: `assignments/${uniqueFilename}`,
      fileUrl: `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/assignments/${uniqueFilename}`,
    }:null,
  });

  res.status(201).json({
    success: true,
    message: "Assignment created successfully.",
  });
});

//get Assignment
export const getAssignment = catchAsyncError(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ErrorHandler("Assignment not found", 404));
  const url = assignment.file_details.fileKey?(await getSignedURL(assignment.file_details.fileKey)):null;
  assignment.file_details.fileUrl = url;
  res.status(200).json({
    success: true,
    assignment,
  });
});

//delete Assignment
export const deleteAssignment = catchAsyncError(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ErrorHandler("Assignment not found", 404));
  assignment.file_details.fileKey && await deleteFile(assignment.file_details.fileKey);
  await assignment.deleteOne();
  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully",
  });
});

//update Assignment
export const updateAssignment = catchAsyncError(async (req, res, next) => {
  const { assignment_name, questions } = req.body;


  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ErrorHandler("Assignment not found", 404));


  if (assignment_name){
    assignment.assignment_name = assignment_name;
  }
  if (questions){
    assignment.questions = questions;
  }
  
  if (!req.files || !req.files["file"]) {
    await assignment.save();
    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
    });
  }
  assignment.file_details.fileKey && await deleteFile(assignment.file_details.fileKey);
  const file = req.files["file"][0];
  const uniqueFilename = `${Date.now()}_${file.originalname}`;
  const s3Response = await uploadFile(
    { ...file, filename: uniqueFilename },
    "assignments"
  );
  assignment.file_details = {
    fileName: file.originalname,
    fileSize: file.size,
    fileKey: `assignments/${uniqueFilename}`,
    fileUrl: `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/assignments/${uniqueFilename}`,
  };
  await assignment.save();
  res.status(200).json({
    success: true,
    message: "Assignment updated successfully",
  });
});
