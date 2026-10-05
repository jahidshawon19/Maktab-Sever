const Attendance = require('../models/Attendance');
const Recording = require('../models/Recording');
const User = require('../models/User');

// Mark student present when they upload a recording
async function recordAttendance(studentId, recordingId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, date: { $gte: today, $lt: tomorrow } },
      {
        date: today,
        status: 'present',
        recordingId,
      },
      { upsert: true, new: true }
    );

    return attendance;
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
}

// Get student's attendance for a date range
async function getStudentAttendance(studentId, startDate, endDate) {
  try {
    const attendance = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('recordingId')
      .sort({ date: -1 });

    return attendance;
  } catch (error) {
    console.error('Error getting student attendance:', error);
    throw error;
  }
}

// Get all students' attendance for a specific date
async function getAttendanceByDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('student', 'fullName phone')
      .populate('recordingId');

    return attendance;
  } catch (error) {
    console.error('Error getting attendance by date:', error);
    throw error;
  }
}

// Get attendance report for all students in a date range
async function getAttendanceReport(startDate, endDate) {
  try {
    const students = await User.find({ role: 'student' });
    const report = {};

    for (const student of students) {
      const attendance = await Attendance.find({
        student: student._id,
        date: { $gte: startDate, $lte: endDate },
      });

      report[student._id] = {
        student: {
          id: student._id,
          fullName: student.fullName,
          phone: student.phone,
        },
        attendance,
        present: attendance.filter((a) => a.status === 'present').length,
        absent: attendance.filter((a) => a.status === 'absent').length,
      };
    }

    return report;
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw error;
  }
}

module.exports = {
  recordAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  getAttendanceReport,
};
