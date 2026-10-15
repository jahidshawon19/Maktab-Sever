const express = require('express');
const router = express.Router();
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const authMiddleware = require('../middleware/authmiddleware');
const requireRole = require('../middleware/role');
const {
  getStudentAttendance,
  getAttendanceByDate,
  getAttendanceReport,
} = require('../controllers/attendanceController');

// Get my attendance (student)
router.get('/my-attendance', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await getStudentAttendance(req.userId, start, end);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a specific date (teacher/admin)
router.get('/by-date', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const attendance = await getAttendanceByDate(new Date(date));
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance report for date range (teacher/admin)
router.get('/report', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const report = await getAttendanceReport(start, end);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF attendance report (teacher/admin)
router.get('/report-pdf', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const report = await getAttendanceReport(start, end);

    const filename = `Attendance_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.pdf`;

    const pdfDoc = await PDFDocument.create();
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 612, pageHeight = 792, margin = 50;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const col1 = margin, col2 = 280, col3 = 370, col4 = 460;

    // Title
    const title = 'Student Attendance Report';
    const titleW = bold.widthOfTextAtSize(title, 18);
    page.drawText(title, { x: (pageWidth - titleW) / 2, y, size: 18, font: bold, color: rgb(0, 0, 0) });
    y -= 24;

    // Date range
    const period = `Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
    const periodW = regular.widthOfTextAtSize(period, 11);
    page.drawText(period, { x: (pageWidth - periodW) / 2, y, size: 11, font: regular, color: rgb(0.3, 0.3, 0.3) });
    y -= 30;

    // Headers
    page.drawText('Student Name', { x: col1, y, size: 11, font: bold });
    page.drawText('Present', { x: col2, y, size: 11, font: bold });
    page.drawText('Absent', { x: col3, y, size: 11, font: bold });
    page.drawText('Percentage', { x: col4, y, size: 11, font: bold });
    y -= 5;
    page.drawLine({ start: { x: col1, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0, 0, 0) });
    y -= 18;

    const students = Object.values(report).sort((a, b) =>
      a.student.fullName.localeCompare(b.student.fullName)
    );

    for (const { student, present, absent } of students) {
      if (y < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';

      page.drawText(student.fullName, { x: col1, y, size: 10, font: regular });
      page.drawText(String(present), { x: col2, y, size: 10, font: regular });
      page.drawText(String(absent), { x: col3, y, size: 10, font: regular });
      page.drawText(percentage, { x: col4, y, size: 10, font: regular });
      y -= 22;
    }

    // Footer
    const footer = `Generated on ${new Date().toLocaleString()}`;
    page.drawText(footer, { x: col1, y: margin - 20, size: 9, font: regular, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
