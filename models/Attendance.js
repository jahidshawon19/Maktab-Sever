const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'absent',
    },
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recording',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per student per date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
