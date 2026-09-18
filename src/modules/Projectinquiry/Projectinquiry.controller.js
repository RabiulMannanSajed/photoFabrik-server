import {
  createProjectInquiryIntoDB,
  deleteInquiryService,
  getProjectInquiryByIdFromDB,
  inquirySummaryService,
  listProjectInquiriesFromDB,
  markInquiryReadService,
  updateInquiryNoteService,
  updateInquiryStatusService,
} from "./Projectinquiry.service.js";

export const createProjectInquiry = async (req, res, next) => {
  try {
    const { fullName, email, helpNeeded, projectStage, projectDetails } =
      req.body;

    if (!fullName || !email || !projectDetails) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }
    if (!Array.isArray(helpNeeded) || helpNeeded.length === 0) {
      return res
        .status(400)
        .json({ message: "Select at least one kind of help you need." });
    }
    if (!projectStage) {
      return res
        .status(400)
        .json({ message: "Let us know where you are in the project." });
    }

    const inquiry = await createProjectInquiryIntoDB(req.body);

    return res.status(201).json({
      message: "Project inquiry received.",
      data: inquiry,
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectInquiry = async (req, res, next) => {
  try {
    const inquiry = await getProjectInquiryByIdFromDB(req.params.id);
    return res.status(200).json({ data: inquiry });
  } catch (err) {
    next(err);
  }
};

export const listProjectInquiries = async (req, res, next) => {
  try {
    const result = await listProjectInquiriesFromDB({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const inquirySummary = async (req, res, next) => {
  try {
    const data = await inquirySummaryService();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const patchInquiryStatus = async (req, res, next) => {
  try {
    const doc = await updateInquiryStatusService(
      req.params.id,
      req.body.status,
    );
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const patchInquiryNote = async (req, res, next) => {
  try {
    const doc = await updateInquiryNoteService(
      req.params.id,
      req.body.adminNote,
    );
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const postMarkInquiryRead = async (req, res, next) => {
  try {
    const doc = await markInquiryReadService(req.params.id);
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const deleteInquiry = async (req, res, next) => {
  try {
    await deleteInquiryService(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Inquiry deleted." });
  } catch (err) {
    next(err);
  }
};
