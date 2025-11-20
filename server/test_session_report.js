import mongoose from "mongoose";
import dotenv from "dotenv";
import StudySession from "./models/studySessionModel.js";
import Report from "./models/Report.js";

dotenv.config();

const testReportCreation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Find the session from the image (with ID 691ef02a7cfb13d9a8fe0986)
    const sessionId = "691ef02a7cfb13d9a8fe0986";
    const session = await StudySession.findById(sessionId);

    if (!session) {
      console.log("❌ Session not found");
      process.exit(1);
    }

    console.log("\n📋 Current Session:");
    console.log("  ID:", session._id);
    console.log("  Subject:", session.subject);
    console.log("  Topic:", session.topic);
    console.log("  Notes:", session.notes);
    console.log("  Status:", session.status);

    // Check if report already exists for this session
    const existingReport = await Report.findOne({ sessionId });
    if (existingReport) {
      console.log("\n✅ Report already exists for this session:");
      console.log("  Report ID:", existingReport._id);
      console.log("  Title:", existingReport.title);
      console.log("  Content:", existingReport.content);
      console.log("  Type:", existingReport.reportType);
    } else {
      console.log("\n❌ No report found for this session. Creating one...");

      // Create a report from the session notes
      if (session.notes && session.notes.trim() !== "") {
        const reportData = {
          user: session.userId,
          sessionId: session._id,
          title: `${session.subject} - ${session.topic}`,
          content: session.notes,
          reportType: "session",
          generatedAt: new Date(),
        };

        const report = await Report.create(reportData);
        console.log("\n✅ Report created successfully:");
        console.log("  Report ID:", report._id);
        console.log("  Title:", report.title);
        console.log("  Content:", report.content);
        console.log("  Type:", report.reportType);
      } else {
        console.log("❌ Session has no notes to create report from");
      }
    }

    // List all reports for this user
    const allReports = await Report.find({ user: session.userId });
    console.log("\n📊 All Reports for User:", session.userId);
    console.log(`  Total Reports: ${allReports.length}`);
    allReports.forEach((r) => {
      console.log(`  - ${r.title} (${r.reportType})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

testReportCreation();
