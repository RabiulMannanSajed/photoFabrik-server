import { model, Schema } from "mongoose";

/**
 * ProjectQuote — the rich form submitted from
 * PhotoFabrik/src/Home/Projectquotepage/Projectquotepage.jsx
 *
 * Lifecycle:
 *   created         → status: "unread",  priority: "normal"
 *   urgency detected on create → priority: "urgent", priorityReason populated
 *   admin opens it  → status: "read", readAt set
 *   admin manages   → status / priority / adminNote
 */
const projectQuoteSchema = new Schema(
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
      required: [true, "Phone number is required"],
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    projectDescription: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    isStudent: {
      type: Boolean,
      default: false,
    },
    agreedToNDA: {
      type: Boolean,
      default: false,
    },
    agreedToTerms: {
      type: Boolean,
      required: [true, "Terms must be accepted"],
      validate: {
        validator: (v) => v === true,
        message: "Terms must be accepted",
      },
    },

    /**
     * CAD file in GridFS.
     */
    file: {
      originalName: { type: String, required: true },
      fileId: { type: Schema.Types.ObjectId, required: true },
      mimetype: {
        type: String,
        default: "application/octet-stream",
      },
      size: { type: Number, required: true },
      extension: { type: String, required: true },
    },

    /**
     * Workflow status.
     */
    status: {
      type: String,
      enum: [
        "unread",
        "read",
        "in_review",
        "quoted",
        "rejected",
        "completed",
      ],
      default: "unread",
      index: true,
    },

    /**
     * Manual + auto urgency.
     */
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
      index: true,
    },
    priorityReason: {
      type: String,
      default: "",
    },
    priorityManuallySet: {
      type: Boolean,
      default: false,
    },

    /**
     * Internal-only admin note.
     */
    adminNote: {
      type: String,
      default: "",
    },

    /**
     * Optional assignment (extensible; admin model is added separately).
     */
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for the admin list view: unread/urgent + newest first.
projectQuoteSchema.index({ status: 1, priority: -1, createdAt: -1 });
projectQuoteSchema.index({ createdAt: -1 });
projectQuoteSchema.index({ email: 1 });
projectQuoteSchema.index({ phone: 1 });
projectQuoteSchema.index({ industry: 1 });

export const ProjectQuote = model("ProjectQuote", projectQuoteSchema);
