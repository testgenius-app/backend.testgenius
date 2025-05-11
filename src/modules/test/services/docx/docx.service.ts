import { Injectable } from '@nestjs/common';
import { Test } from '../../types/test.type';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
@Injectable()
export class DocxService {
  async generateDocx(test: Test): Promise<{ zipFilePath: string }> {
    const tempDir = path.resolve(process.cwd(), 'temp');
    const questionsPath = path.resolve(tempDir, `${test.id}_test_questions.docx`);
    const answersPath = path.resolve(tempDir, `${test.id}_test_answers.docx`);
    const zipPath = path.resolve(tempDir, `${test.id}_test.zip`);

    fs.mkdirSync(tempDir, { recursive: true });

    // Create questions document
    const questionsDoc = this.createQuestionsDocument(test);
    await Packer.toBuffer(questionsDoc).then((buffer: Buffer) => {
      fs.writeFileSync(questionsPath, buffer);
    });

    // Create answers document
    const answersDoc = this.createAnswersDocument(test);
    await Packer.toBuffer(answersDoc).then((buffer: Buffer) => {
      fs.writeFileSync(answersPath, buffer);
    });

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

  private createQuestionsDocument(test: Test): Document {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: test.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              text: test.description,
              spacing: { before: 200, after: 400 },
            }),
            ...test.sections.flatMap((section) => [
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                text: section.instruction,
                spacing: { before: 100, after: 200 },
              }),
              ...section.tasks.flatMap((task) =>
                task.questions.map(
                  (question, index) =>
                    new Paragraph({
                      text: `${index + 1}. ${question.questionText}`,
                      spacing: { before: 200 },
                      children: question.options.map(
                        (option) =>
                          new Paragraph({
                            text: option,
                            spacing: { before: 100 },
                          }),
                      ),
                    }),
                ),
              ),
            ]),
          ],
        },
      ],
    });
  }

  private createAnswersDocument(test: Test): Document {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `${test.title} - Answer Key`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            }),
            ...test.sections.flatMap((section) => [
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 200 },
              }),
              ...section.tasks.flatMap((task) =>
                task.questions
                  .map((question, index) => [
                    new Paragraph({
                      text: `${index + 1}. Answer: ${question.answers.join(', ')}`,
                      spacing: { before: 200 },
                    }),
                    new Paragraph({
                      text: `Explanation: ${question.explanation}`,
                      spacing: { before: 100, after: 200 },
                    }),
                  ])
                  .flat(),
              ),
            ]),
          ],
        },
      ],
    });
  }
}
