import { model, Schema } from "mongoose";

const projectInquirySchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    companySize: {
      type: String,
      trim: true,
      default: "",
    },
    helpNeeded: {
      type: [String],
      required: [true, "Select at least one kind of help you need"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Select at least one kind of help you need",
      },
    },
    projectStage: {
      type: String,
      required: [true, "Project stage is required"],
      trim: true,
    },
    projectDetails: {
      type: String,
      required: [true, "Project details are required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectInquirySchema.index({ status: 1, createdAt: -1 });
projectInquirySchema.index({ createdAt: -1 });
projectInquirySchema.index({ email: 1 });

export const ProjectInquiry = model("ProjectInquiry", projectInquirySchema);
