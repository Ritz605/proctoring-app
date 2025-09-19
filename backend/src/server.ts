import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool, setupDatabase } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

interface ReportRequestBody {
    candidateName: string;
    interviewDuration: string;
    focusLostCount: number;
    multipleFacesCount: number;
    absenceCount: number;
    phoneDetectedCount: number;
    notesDetectedCount: number;
    integrityScore: number;
}

// API endpoint to save a new proctoring report
app.post('/reports', async (req: Request<{}, {}, ReportRequestBody>, res: Response) => {
    try {
        const {
            candidateName,
            interviewDuration,
            integrityScore,
        } = req.body;

        const focusLostCount = req.body.focusLostCount ?? 0;
        const multipleFacesCount = req.body.multipleFacesCount ?? 0;
        const absenceCount = req.body.absenceCount ?? 0;
        const phoneDetectedCount = req.body.phoneDetectedCount ?? 0;
        const notesDetectedCount = req.body.notesDetectedCount ?? 0;

        const [result] = await pool.query(
            `INSERT INTO proctoring_reports 
            (candidate_name, interview_duration, focus_lost_count, multiple_faces_count, absence_count, phone_detected_count, notes_detected_count, integrity_score) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                candidateName,
                interviewDuration,
                focusLostCount,
                multipleFacesCount,
                absenceCount,
                phoneDetectedCount,
                notesDetectedCount,
                integrityScore,
            ]
        );
        
        res.status(201).json({ reportId: (result as any).insertId, message: 'Report saved successfully.' });
    } catch (err: any) {
        console.error('Error saving report:', err);
        res.status(500).json({ message: 'Error saving report', error: err.message });
    }
});

// API endpoint to fetch a single report by ID
app.get('/reports/:reportId', async (req: Request<{reportId: string}>, res: Response) => {
    try {
        const { reportId } = req.params;
        const [rows] = await pool.query('SELECT * FROM proctoring_reports WHERE id = ?', [reportId]);

        if ((rows as any[]).length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const report = (rows as any[])[0];
        const formattedReport = {
            candidateName: report.candidate_name,
            interviewDuration: report.interview_duration,
            focusLostCount: report.focus_lost_count,
            facesDetectedCount: report.multiple_faces_count,
            notesDetectedCount: report.notes_detected_count,
            phoneDetectedCount: report.phone_detected_count,
            absenceCount: report.absence_count, 
            integrityScore: report.integrity_score,
        };

        res.json(formattedReport);
    } catch (err: any) {
        console.error('Error fetching report:', err);
        res.status(500).json({ message: 'Error fetching report', error: err.message });
    }
});

// Initialize the database and start the server
setupDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
