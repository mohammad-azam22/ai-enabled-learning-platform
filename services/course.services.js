import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";
import axios from 'axios';

// Define the path for your local LanceDB database
const DB_PATH = './lancedb_data';
const TABLE_NAME = 'course_embeddings';

// Function to generate embeddings using Ollama API
async function generateOllamaEmbedding(text, modelName = 'nomic-embed-text') {
    try {
        const response = await axios.post('http://127.0.0.1:11434/api/embed', {
            input: text,
            model: modelName,
        });

        return response.data.embeddings[0]; // Return embedding vector
    }
    catch (error) {
        console.error('Error calling Ollama Embedding API:', error.message, error.response?.data);
        return null;
    }
}

// Function to process course and store embeddings in LanceDB
async function processCourseForEmbeddings(course) {
    let db = null;
    let table = null;

    try {
        const courseId = course._id.toString();
        const courseTitle = course.title;
        console.log(`Processing course ${courseId} "${courseTitle}" for embeddings...`);

        db = await lancedb.connect(DB_PATH);

        try {
            table = await db.openTable(TABLE_NAME);
            console.log(`Opened existing table "${TABLE_NAME}".`);
        } catch (e) {
            console.error("Table does not exist, creating new table...", e);
            const schema = new arrow.Schema([
                new arrow.Field("course_id", new arrow.Utf8()),
                new arrow.Field("course_title", new arrow.Utf8()),
                new arrow.Field("unit_title", new arrow.Utf8()),
                new arrow.Field("lesson_title", new arrow.Utf8()),
                new arrow.Field("content", new arrow.Utf8()),
                new arrow.Field("vectors", new arrow.FixedSizeList(768, new arrow.Field("vector", new arrow.Float32())))
            ]);

            table = await db.createEmptyTable(TABLE_NAME, schema);
            console.log(`Created LanceDB table "${TABLE_NAME}" with schema.`);
        }

        const embeddingsToInsert = [];

        for (const unit of course.units) {
            for (const lesson of unit.lessons) {
                if (lesson.content && Array.isArray(lesson.content) && lesson.content.length > 0) {
                    const lessonContent = lesson.content.join('\n');
                    const embedding = await generateOllamaEmbedding(lessonContent);
                    
                    if (embedding && Array.isArray(embedding) && embedding.length === 768) { // Valid dimension
                        embeddingsToInsert.push({
                            course_id: courseId,
                            course_title: courseTitle,
                            unit_title: unit.title,
                            lesson_title: lesson.title,
                            content: lessonContent,
                            vectors: [...embedding] // Correct format without extra nesting
                        });
                    } 
                    else {
                        console.warn(`Invalid embedding for lesson: "${lesson.title}" in unit: "${unit.title}"`);
                    }
                }
            }
        }

        if (embeddingsToInsert.length > 0) {
            await table.add(embeddingsToInsert);
            console.log(`Inserted ${embeddingsToInsert.length} embeddings for course "${courseTitle}" into LanceDB.`);
        } else {
            console.warn(`No valid embeddings to insert for course "${courseTitle}".`);
        }

        console.log(`Finished processing course "${courseTitle}".`);
        return true;

    } catch (error) {
        console.error(`Error processing course "${courseTitle}":`, error);
        return false;
    }
}

export { generateOllamaEmbedding, processCourseForEmbeddings };
