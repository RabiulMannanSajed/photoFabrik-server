// import { model, Schema } from "mongoose";

// const customerQuoteSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     phone: {
//       type: String,
//       required: [true, "Phone number is required"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       trim: true,
//       lowercase: true,
//     },
//     note: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     file: {
//       originalName: { type: String, required: true },
//       storedName: { type: String, required: true },
//       path: { type: String, required: true },
//       mimetype: { type: String },
//       size: { type: Number },
//       extension: { type: String },
//     },
//     status: {
//       type: String,
//       enum: ["pending", "in_review", "quoted", "rejected"],
//       default: "pending",
//     },
//   },
//   { timestamps: true },
// );

// export const CustomerQuote = model("CustomerQuote", customerQuoteSchema);

import { model, Schema } from "mongoose";

const customerQuoteSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * CAD file information.
     *
     * The actual file is stored in MongoDB GridFS.
     */
    file: {
      originalName: {
        type: String,
        required: true,
      },

      fileId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      mimetype: {
        type: String,
        default: "application/octet-stream",
      },

      size: {
        type: Number,
        required: true,
      },

      extension: {
        type: String,
        required: true,
      },
    },

    status: {
      type: String,

      enum: ["pending", "in_review", "quoted", "rejected"],

      default: "pending",
    },
  },

  {
    timestamps: true,
  },
);

export const CustomerQuote = model("CustomerQuote", customerQuoteSchema);
