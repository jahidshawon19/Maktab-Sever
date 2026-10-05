const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });
    const filename = `Attendance_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Student Attendance Report', { align: 'center' });
    doc.moveDown(0.5);

    // Date range
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    doc.fontSize(12).font('Helvetica').text(`Period: ${startStr} to ${endStr}`, { align: 'center' });
    doc.moveDown(1);

    // Table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;
    const col3 = 350;
    const col4 = 450;
    const rowHeight = 25;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Student Name', col1, tableTop);
    doc.text('Present', col2, tableTop);
    doc.text('Absent', col3, tableTop);
    doc.text('Percentage', col4, tableTop);

    // Draw line under headers
    doc.moveTo(col1, tableTop + 18).lineTo(550, tableTop + 18).stroke();

    // Table rows
    doc.fontSize(10).font('Helvetica');
    let yPosition = tableTop + 30;
    const pageHeight = doc.page.height;
    const bottomMargin = 60;

    const students = Object.values(report).sort((a, b) =>
      a.student.fullName.localeCompare(b.student.fullName)
    );

    for (const studentReport of students) {
      const { student, present, absent } = studentReport;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

      // Check if we need a new page
      if (yPosition > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = 40;
      }

      doc.text(student.fullName, col1, yPosition);
      doc.text(present.toString(), col2, yPosition);
      doc.text(absent.toString(), col3, yPosition);
      doc.text(`${percentage}%`, col4, yPosition);

      yPosition += rowHeight;
    }

    // Footer
    doc.fontSize(9).text('Generated on ' + new Date().toLocaleString(), { align: 'center' }, pageHeight - 30);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
