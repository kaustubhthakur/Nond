const express = require("express");
const router = express.Router({ mergeParams: true });

const reportController = require("../controllers/reports");
const { authenticate } = require("../middleware/auth"); 
router.get(
  "/stores/:storeId/reports/monthly",
  authenticate,
  reportController.getMonthlyReport
);


router.get(
  "/stores/:storeId/reports/monthly/pdf",
  authenticate,
  reportController.downloadMonthlyReportPdf
);

module.exports = router;