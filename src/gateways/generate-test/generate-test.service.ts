import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestParamsDto } from './dto/test-params.dto';

@Injectable()
export class GenerateTestService {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.get('GEMINI_API_KEY'),
    });
    this.model = this.configService.get('GEMINI_API_MODEL');
  }

  async generateTest(testParams: TestParamsDto) {
    try {
      const {
        subject,
        gradeLevel,
        title = `${subject.charAt(0).toUpperCase() + subject.slice(1)} Test for Grade ${gradeLevel}`,
        description = `A comprehensive ${subject} test for ${gradeLevel} level students.`,

        questionsPerSection = 2,
        tags = [subject, `grade-${gradeLevel}`, 'assessment'],
        sectionCount = 1,
        topic = 'random',
      } = testParams;

      const sectionTypes = [
        'multiple_choice',
        'short_answer',
        'matching_the_headings',
        'reading_passage',
        'fill_in_the_blank',
        'true_false',
        'matching',
      ];
      // Build the instruction prompt
      const prompt = `
    You are an expert educational test creator with deep knowledge of ${subject} at the ${gradeLevel} level.
    
    Create a complete educational test following the JSON schema provided below. The test should be:
    - Subject: ${subject}
    - Grade Level: ${gradeLevel}
    - Title: ${title}
    - Description: ${description}
    - Section types: ${sectionTypes.join(', ')}
    - Questions per section: ${questionsPerSection}
    - Tags: ${tags.join(', ')}
    - Section count: ${sectionCount}
    - Topic: ${topic}
    
    The test should be challenging but appropriate for the specified grade level. Include a variety of question types and difficulty levels.
    Make sure all content is educationally sound, accurate, and follows best practices for assessment design.
    
    Return ONLY valid JSON that follows this schema exactly:
    
    {
      "test_id": "", // Generate a unique test ID like "${subject}_grade${gradeLevel}_test1"
      "title": "", // Use the title provided or create an appropriate one
      "subject": "", // Use the subject provided
      "gradeLevel": "", // Use the grade level provided
      "description": "", // Use the description provided or create an appropriate one
      "tags": [], // Include the tags provided plus any additional relevant ones
      "sectionCount": ${sectionCount}, // Use the section count provided
    
      "sections": [
        {
          "section_id": "", // Generate a unique ID for each section
          "title": "", // Create an appropriate title for the section
          "instruction": "", // Clear instructions for the section
          "type": "", // Use one of the section types provided
    
          "context": {
            "text": "", // Include relevant context if needed (e.g., reading passage)
            "image_url": "", // Leave empty or suggest an image description
            "audio_url": "", // Leave empty
            "video_url": "" // Leave empty
          },
    
          "tasks": [
            {
              "task_id": "", // Generate a unique ID for each task
              "title": "", // Create an appropriate title for the task
              "type": "", // Specify the task type (e.g., multiple_choice, short_answer)
    
              "questions": [
                {
                  "question_id": "", // Generate a unique ID for each question
                  "questionText": "", // Clear, well-written question text
    
                  "options": [], // For multiple choice and true false only: include 4 or less options with one correct
    
                  "answers": [""], // The correct answer (for multiple choice, use the letter or full text)
                  "acceptableAnswers": [], // For short answer questions, list acceptable variations
                  "answerKeywords": [], // For open-ended questions, list key concepts to look for
                  "expectedResponseFormat": "", // Format expected (text, number, etc.)
    
                  "score": null, // Points for this question (e.g., 1, 2, 5)
                  "explanation": "", // Clear explanation of the correct answer
    
                  "imageUrl": "", // Leave empty or suggest an image description
                  "audioUrl": "", // Leave empty
    
                  "labelLocation": {
                    "x": null, // Leave null
                    "y": null // Leave null
                  }
                }
                // Create the requested number of questions per section
              ]
            }
          ]
        }
        // Create one section for each section type provided
      ]
    }
    
    Make sure your JSON is valid and properly formatted. Do NOT include any explanations, comments, or text outside the JSON structure.
    `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [prompt],
      });
      try {
        if (response.text.includes('```json')) {
          const jsonStr = response.text
            .split('```json')[1]
            .split('```')[0]
            .trim();
          const generatedTest = JSON.parse(jsonStr);
          return generatedTest;
        }
        const generatedTest = JSON.parse(response.text);
        return generatedTest;
      } catch (error) {
        this.logger.error('Generated content is not valid JSON');
        throw new Error('Failed to generate valid test JSON');
      }
    } catch (error) {
      this.logger.error(`Error generating test: ${error.message}`);
      throw error;
    }
  }

  private async initializeAIModel() {
    try {
      const prompt = `

      You are an AI assistant designed to understand and process a standardized test schema represented in JSON format. Below is the structure we will be using across different domains (e.g. language, science, mathematics) and various assessment types (e.g. multiple choice, essay, diagram labeling).

      Your first task is to read and deeply understand the structure and purpose of the following JSON schema. If you fully understand it, return:

      { "understood": true }

      Otherwise, return:

      { "understood": false }

      --------------------------
      Test Schema Explanation:
      --------------------------

      The structure is a hierarchical JSON object that defines a complete academic test. It is organized in the following levels:

      1. **Test level (root object)**:
         - 'test_id': Unique identifier for the test.
         - 'title': Name of the test.
         - 'subject': Subject domain (e.g., "math", "biology", "english").
         - 'grade_level': Educational level (e.g., "10", "IELTS").
         - 'description': Summary of the test.
         - 'duration_minutes': Time limit (optional).
         - 'tags': Keywords for search or categorization.

      2. **Sections ('sections[]')**:
         - Each test consists of one or more sections like "Reading", "Listening", "Writing", etc.
         - Each section includes:
           - 'section_id': Unique identifier.
           - 'title': Title displayed to the user.
           - 'instruction': Instruction for that section.
           - 'type': Section type (e.g. reading, listening, diagram_labeling).

         - 'context': Media or text content needed to understand the section (e.g. reading passage, image, audio).
           - 'text', 'image_url', 'audio_url', 'video_url'

      3. **Tasks ('tasks[]')**:
         - Sections contain one or more tasks (e.g. a paragraph or diagram with related questions).
         - Each task contains:
           - 'task_id': Unique ID.
           - 'title': Optional name.
           - 'type': Task type (multiple_choice, short_answer, essay, etc.)

      4. **Questions ('questions[]')**:
         - Core unit for evaluation.
         - Fields include:
           - 'question_id': Unique identifier.
           - 'question_text': Main text of the question.
           - 'options': Only for multiple-choice questions.
           - 'answer': Simple correct answer (optional legacy support).
           - 'acceptable_answers': List of valid user input variations for short_answer.
           - 'answer_keywords': Keywords to look for in open-ended responses (essay).
           - 'expected_response_format': Format such as "text", "number", "latex", "code", etc.
           - 'score': Score awarded for correct answer.
           - 'explanation': Optional feedback or explanation.
           - 'image_url', 'audio_url': Optional media for the question.
           - 'label_location': Used only in diagram labeling; contains 'x' and 'y' coordinates.

      This structure is designed to be flexible and extensible to support all educational subjects and testing formats (language exams, standardized science quizzes, mathematical assessments, and more).

      Now confirm whether you’ve understood the schema completely.

      Expected Output:
      { "understood": true }
      
      after that you will be given a JSON schema and a task description.
      {
  "test_id": "", // Unique test identifier (e.g. "math_grade10_test1")
  "title": "", // Full name of the test (e.g. "Grade 10 Mathematics Midterm")
  "subject": "", // Subject of the test (e.g. "mathematics", "biology", "english")
  "grade_level": "", // Target education level or class (e.g. "10", "IELTS", "undergraduate")
  "description": "", // Brief description of the test purpose or scope
  "duration_minutes": null, // Optional time limit in minutes (null if untimed)
  "tags": [], // Optional tags for categorization (e.g. ["PISA", "algebra", "diagnostic"])

  "sections": [ // A test can have one or more sections (e.g. Reading, Listening, Writing)
    {
      "section_id": "", // Unique identifier for the section
      "title": "", // Title shown to users (e.g. "Reading Comprehension")
      "instruction": "", // Instruction for the whole section (e.g. "Read the passage and answer the questions.")
      "type": "", // Type of the section: reading, writing, listening, diagram_labeling, etc.

      "context": { // Context material relevant to the entire section
        "text": "", // Optional text block (e.g. passage, description, question stem)
        "image_url": "", // Optional image (e.g. diagram, map)
        "audio_url": "", // Optional audio file (e.g. for listening sections)
        "video_url": "" // Optional video (e.g. for multimedia questions)
      },

      "tasks": [ // Each section can have multiple tasks (subgroups of questions, like a paragraph or image)
        {
          "task_id": "", // Unique task identifier
          "title": "", // Title of the task (optional)
          "type": "", // Type of task (multiple_choice, short_answer, essay, matching, etc.)

          "questions": [ // One or more questions within the task
            {
              "question_id": "", // Unique question ID
              "question_text": "", // The main question text shown to the user

              "options": [], // Only used in multiple_choice or multiple_select (e.g. ["A", "B", "C", "D"])

              "answer": "", // Simple expected answer (optional, legacy field for MCQ)
              "acceptable_answers": [], // Used for short_answer: list of acceptable user answers (e.g. ["he is", "he's"])
              "answer_keywords": [], // For essay or open-ended: keywords expected in user answer (e.g. ["photosynthesis", "sunlight"])
              "expected_response_format": "", // Format of answer: "text", "number", "latex", "code", "long_text", "audio", etc.

              "score": null, // Points for the question (can be fractional)
              "explanation": "", // Optional explanation shown after answering or during review

              "image_url": "", // Optional image specific to this question
              "audio_url": "", // Optional audio specific to this question

              "label_location": { // Only used for diagram labeling (position of label on image)
                "x": null, // X coordinate (in pixels or percentage based on UI)
                "y": null  // Y coordinate
              }
            }
          ]
        }
      ]
    }
  ]
}

      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [prompt],
      });
      return response.text;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
