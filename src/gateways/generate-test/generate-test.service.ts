import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestParamsDto } from './dto/test-params.dto';

@Injectable()
export class GenerateTestService implements OnModuleInit {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private isModelInitialized = false;
  private readonly CHUNK_SIZE = 20; // Maximum questions per chunk

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.get('GEMINI_API_KEY'),
    });
    this.model = this.configService.get('GEMINI_API_MODEL');
  }

  async onModuleInit() {
    await this.initializeAIModel();
  }

  private async generateTestChunk(
    subject: string,
    gradeLevel: string,
    sectionTitle: string,
    questionCount: number,
    sectionNumber: number,
  ) {
    const prompt = `
Create a test section with these parameters:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Section Title: ${sectionTitle}
- Questions count: ${questionCount}
- Section Number: ${sectionNumber}
- Language: Uzbek

Rules:
1. Multiple choice options must not include letter prefixes (e.g., "Paris", not "A. Paris")
2. Answers must exactly match one of the options
3. All content must be in Uzbek language
4. Questions should be challenging but appropriate for the grade level

Return a valid JSON following this structure:
{
  "section_id": "section_${sectionNumber}",
  "title": "${sectionTitle}",
  "instruction": "Clear instructions in Uzbek",
  "type": "multiple_choice",
  "context": {
    "text": "",
    "image_url": "",
    "audio_url": "",
    "video_url": ""
  },
  "tasks": [
    {
      "task_id": "task_${sectionNumber}",
      "title": "${sectionTitle} masalalari",
      "type": "multiple_choice",
      "questions": [
        {
          "question_id": "q${(sectionNumber-1)*this.CHUNK_SIZE + 1}",
          "questionText": "Question text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answers": ["Correct Option"],
          "acceptableAnswers": [],
          "answerKeywords": [],
          "expectedResponseFormat": "text",
          "score": 1,
          "explanation": "Explanation",
          "imageUrl": "",
          "audioUrl": "",
          "labelLocationX": null,
          "labelLocationY": null
        }
      ]
    }
  ]
}`;
    console.log(prompt);
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [prompt],
    });

    try {
      const jsonStr = response.text.includes('```json') 
        ? response.text.split('```json')[1].split('```')[0].trim()
        : response.text.trim();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Generated content is not valid JSON');
      throw new Error('Failed to generate valid test JSON');
    }
  }

  async generateTest(testParams: TestParamsDto) {
    try {
      if (!this.isModelInitialized) {
        await this.initializeAIModel();
        this.isModelInitialized = true;
      }

      const {
        subject,
        gradeLevel,
        title = `${subject.charAt(0).toUpperCase() + subject.slice(1)} Test for Grade ${gradeLevel}`,
        description = `A comprehensive ${subject} test for ${gradeLevel} level students.`,
        questionsPerSection = 2,
        tags = [subject, `grade-${gradeLevel}`, 'assessment'],
        sectionCount = 1,
        topic = 'random',
        prompt: userPrompt = '',
      } = testParams;

      const totalQuestions = questionsPerSection * sectionCount;
      const sections = [];

      // Generate test metadata
      const testMetadata = {
        test_id: `${subject}_grade${gradeLevel}_test1`,
        title,
        subject,
        gradeLevel,
        description,
        tags,
        sectionCount,
        prompt: userPrompt,
        sections: []
      };

      // If total questions is small, generate all at once
      if (totalQuestions <= this.CHUNK_SIZE) {
        const prompt = `
Create a test with these parameters:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Title: ${title}
- Description: ${description}
- Questions per section: ${questionsPerSection}
- Sections: ${sectionCount}
- Topic: ${topic}
- Language: Uzbek or if user prompt is not empty, use user prompt
- Prompt: ${userPrompt}

Rules:
1. Multiple choice options must not include letter prefixes (e.g., "Paris", not "A. Paris")
2. Answers must exactly match one of the options
3. All content must be in Uzbek language
4. Questions should be challenging but appropriate for the grade level

Return a valid JSON following this structure:
{
  "test_id": "${testMetadata.test_id}",
  "title": "${title}",
  "subject": "${subject}",
  "gradeLevel": "${gradeLevel}",
  "description": "${description}",
  "tags": ${JSON.stringify(tags)},
  "sectionCount": ${sectionCount},
  "sections": [
    {
      "section_id": "section_1",
      "title": "Section Title",
      "instruction": "Clear instructions",
      "type": "multiple_choice",
      "context": {
        "text": "",
        "image_url": "",
        "audio_url": "",
        "video_url": ""
      },
      "tasks": [
        {
          "task_id": "task_1",
          "title": "Task Title",
          "type": "multiple_choice",
          "questions": [
            {
              "question_id": "q1",
              "questionText": "Question text",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "answers": ["Correct Option"],
              "acceptableAnswers": [],
              "answerKeywords": [],
              "expectedResponseFormat": "text",
              "score": 1,
              "explanation": "Explanation",
              "imageUrl": "",
              "audioUrl": "",
              "labelLocationX": null,
              "labelLocationY": null
            }
          ]
        }
      ]
    }
  ]
}`;
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: [prompt],
        });
        console.log(response.text);
        try {
          const jsonStr = response.text.includes('```json') 
            ? response.text.split('```json')[1].split('```')[0].trim()
            : response.text.trim();
          
          return JSON.parse(jsonStr);
        } catch (error) {
          this.logger.error('Generated content is not valid JSON');
          throw new Error('Failed to generate valid test JSON');
        }
      }

      // For large tests, generate in chunks
      for (let i = 0; i < sectionCount; i++) {
        const sectionTitle = `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${i + 1}`;
        const section = await this.generateTestChunk(
          subject,
          gradeLevel,
          sectionTitle,
          questionsPerSection,
          i + 1
        );
        sections.push(section);
      }

      testMetadata.sections = sections;
      return testMetadata;

    } catch (error) {
      this.logger.error(`Error generating test: ${error.message}`);
      throw error;
    }
  }

  private async initializeAIModel() {
    try {
      const prompt = `You are an expert educational test creator. Your task is to generate tests in Uzbek language following a specific JSON schema.
      
Key rules:
1. Multiple choice options must not include letter prefixes
2. Answers must exactly match one of the options
3. All content must be in Uzbek language
4. Questions should be challenging but appropriate for the grade level

Confirm your understanding by responding with: { "understood": true }`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [prompt],
      });

      try {
        const jsonStr = response.text.includes('```json') 
          ? response.text.split('```json')[1].split('```')[0].trim()
          : response.text.trim();
        
        const result = JSON.parse(jsonStr);
        return this.logger.log(`${result.understood ? 'AI Model initialized successfully' : 'AI Model initialization failed'}`);
      } catch (error) {
        this.logger.error('Generated content is not valid JSON');
        throw new Error('Failed to generate valid test JSON');
      }
    } catch (error) {
      this.logger.error('Failed to initialize AI model:', error);
      throw error;
    }
  }
}
