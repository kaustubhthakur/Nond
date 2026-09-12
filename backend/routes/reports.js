const express = require("express");
const router = express.Router({ mergeParams: true });

const reportController = require("../controllers/reports");
const verifyToken = require("../middlewares/auth");router.get(
  "/stores/:storeId/reports/monthly",
  verifyToken,
  reportController.getMonthlyReport
);


router.get(
  "/stores/:storeId/reports/monthly/pdf",
  verifyToken,
  reportController.downloadMonthlyReportPdf
);

module.exports = router;