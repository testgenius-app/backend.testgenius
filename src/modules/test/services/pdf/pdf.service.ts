import { Injectable } from '@nestjs/common';
import { Test } from '../../types/test.type';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class PdfService {
  async generatePdf(test: Test): Promise<{ zipFilePath: string }> {
    const tempDir = path.resolve(process.cwd(), 'temp');
    const questionsPath = path.resolve(
      tempDir,
      `${test.id}_test_questions.pdf`,
    );
    const answersPath = path.resolve(tempDir, `${test.id}_test_answers.pdf`);
    const zipPath = path.resolve(tempDir, `${test.id}_test.zip`);

    fs.mkdirSync(tempDir, { recursive: true });

    // Create questions document
    await this.createQuestionsPdf(test, questionsPath);

    // Create answers document
    await this.createAnswersPdf(test, answersPath);

    // Create zip file
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Clean up individual files
        fs.unlinkSync(questionsPath);
        fs.unlinkSync(answersPath);
        resolve({ zipFilePath: zipPath });
      });

      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.file(questionsPath, { name: path.basename(questionsPath) });
      archive.file(answersPath, { name: path.basename(answersPath) });
      archive.finalize();
    });
  }

  private createQuestionsPdf(test: Test, filePath: string): Promise<void> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc.fontSize(24).text(test.title, { align: 'center' });
      doc.moveDown();

      // Description
      doc.fontSize(12).text(test.description);
      doc.moveDown(2);

      // Sections
      test.sections.forEach((section) => {
        doc.fontSize(18).text(section.title);
        doc.moveDown();
        doc.fontSize(12).text(section.instruction);
        doc.moveDown();

        section.tasks.forEach((task) => {
          task.questions.forEach((question, index) => {
            doc.text(`${index + 1}. ${question.questionText}`);
            doc.moveDown();

            question.options.forEach((option) => {
              doc.text(`   • ${option}`);
              doc.moveDown(0.5);
            });
            doc.moveDown();
          });
        });
      });

      doc.end();
      stream.on('finish', resolve);
    });
  }

  private createAnswersPdf(test: Test, filePath: string): Promise<void> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc.fontSize(24).text(`${test.title} - Answer Key`, { align: 'center' });
      doc.moveDown(2);

      // Sections
      test.sections.forEach((section) => {
        doc.fontSize(18).text(section.title);
        doc.moveDown();

        section.tasks.forEach((task) => {
          task.questions.forEach((question, index) => {
            doc
              .fontSize(12)
              .text(`${index + 1}. Answer: ${question.answers.join(', ')}`)
              .moveDown();
            doc.text(`Explanation: ${question.explanation}`).moveDown(2);
          });
        });
      });

      doc.end();
      stream.on('finish', resolve);
    });
  }
}
