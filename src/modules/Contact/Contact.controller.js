import {
  contactSummaryService,
  createContactSubmissionService,
  deleteContactSubmissionService,
  getContactSubmissionByIdService,
  listContactSubmissionsService,
  updateContactNoteService,
  updateContactStatusService,
} from "./Contact.service.js";

/**
 * PUBLIC — POST /contact/submit
 * Body: { name, email, phone?, company?, subject?, message }
 */
export const submitContact = async (req, res, next) => {
  try {
    const doc = await createContactSubmissionService(req.body || {});
    res.status(201).json({
      success: true,
      message: "Thanks! Your message has been received.",
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — GET /contact/submissions
 */
export const listContactSubmissions = async (req, res, next) => {
  try {
    const result = await listContactSubmissionsService({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — GET /contact/dashboard-summary
 */
export const contactSummary = async (req, res, next) => {
  try {
    const data = await contactSummaryService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — GET /contact/submissions/:id
 */
export const getContactSubmission = async (req, res, next) => {
  try {
    const doc = await getContactSubmissionByIdService(req.params.id);
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — PATCH /contact/submissions/:id/status
 */
export const patchContactStatus = async (req, res, next) => {
  try {
    const doc = await updateContactStatusService(
      req.params.id,
      req.body.status,
    );
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — PATCH /contact/submissions/:id/admin-note
 */
export const patchContactNote = async (req, res, next) => {
  try {
    const doc = await updateContactNoteService(
      req.params.id,
      req.body.adminNote,
    );
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — DELETE /contact/submissions/:id
 */
export const deleteContactSubmission = async (req, res, next) => {
  try {
    await deleteContactSubmissionService(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Contact submission deleted." });
  } catch (err) {
    next(err);
  }
};
