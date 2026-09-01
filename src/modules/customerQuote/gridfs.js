import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridFSBucket = null;

/**
 * Initialize MongoDB GridFS.
 *
 * This must be called after mongoose.connect().
 */
export const initGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error(
      "MongoDB connection is not ready. Cannot initialize GridFS.",
    );
  }

  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "quotes",
  });

  console.log("GridFS initialized successfully");
};

/**
 * Get GridFS bucket.
 */
export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error("GridFS has not been initialized.");
  }

  return gridFSBucket;
};
