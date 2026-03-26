const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const OPTIMIZED_DIR = path.join(OUTPUT_DIR, 'optimized');

// Featherless AI config will be read dynamically to ensure dotenv is loaded

// Helper to recursively walk a directory
async function walk(dir, fileList = []) {
  try {
    const dirFiles = await fs.readdir(dir);
    for (const file of dirFiles) {
      const filePath = path.join(dir, file);
      // Ignore node_modules and output/optimized
      if (filePath.includes('node_modules') || filePath.includes(OPTIMIZED_DIR)) {
        continue;
      }
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await walk(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
  } catch (err) {
    // Ignore permissions or missing folder internally
  }
  return fileList;
}

// Group files by extension
function groupFiles(files) {
  const groups = { css: [], js: [], html: [] };
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.css') groups.css.push(file);
    else if (ext === '.js') groups.js.push(file);
    else if (ext === '.html' || ext === '.htm') groups.html.push(file);
  }
  return groups;
}

// Trim content (head + tail strategy for large files)
async function trimContent(filePath, maxChars = 3000) {
  const content = await fs.readFile(filePath, 'utf-8');
  if (content.length <= maxChars) return content;
  
  const keep = Math.floor(maxChars / 2);
  return content.slice(0, keep) + '\n\n/* ... TRUNCATED ... */\n\n' + content.slice(-keep);
}

async function callFeatherless(type, codeContent) {
  const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
  const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';
  const FEATHERLESS_BASE_URL = process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1';

  if (!FEATHERLESS_API_KEY) {
    console.error('Missing FEATHERLESS_API_KEY inside callFeatherless');
    throw new Error('Missing FEATHERLESS_API_KEY environment variable');
  }
  
  const prompt = `You are an expert web development AI. Optimize the following ${type} code. Please provide ONE optimized output. Provide RAW code only. NO markdown blocks. NO explanations. NO conversational text.\n\nCode to optimize:\n${codeContent}`;

  const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FEATHERLESS_API_KEY}`
    },
    body: JSON.stringify({
      model: FEATHERLESS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Featherless API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let optimizedContent = data.choices[0].message.content.trim();

  // If AI mistakenly adds Markdown triple backticks, remove them
  optimizedContent = optimizedContent.replace(/^```[a-z]*\n?/im, '').replace(/\n?```$/m, '');
  return optimizedContent;
}

exports.optimizeOutputFolder = async () => {
  if (!(await fs.stat(OUTPUT_DIR).catch(() => false))) {
    throw new Error('Output folder not found.');
  }

  // Ensure optimized output directory exists
  await fs.mkdir(OPTIMIZED_DIR, { recursive: true });

  const allFiles = await walk(OUTPUT_DIR);
  if (allFiles.length === 0) {
      throw new Error('No files found in output folder to optimize.');
  }
  const groups = groupFiles(allFiles);

  const processGroup = async (type, filePaths, maxLimit = 3) => {
    if (filePaths.length === 0) return null;
    
    // Limit to max files
    const limitedPaths = filePaths.slice(0, maxLimit);
    
    // Read and trim files
    const contents = await Promise.all(
      limitedPaths.map(async (filePath) => {
        const content = await trimContent(filePath);
        return `/* --- File: ${path.basename(filePath)} --- */\n${content}`;
      })
    );
    
    const combinedContent = contents.join('\n\n');
    const optimized = await callFeatherless(type, combinedContent);
    
    const outputPath = path.join(OPTIMIZED_DIR, `optimized.${type}`);
    await fs.writeFile(outputPath, optimized, 'utf-8');
    
    return outputPath;
  };

  // Run all 3 types concurrently
  const [cssPath, jsPath, htmlPath] = await Promise.all([
    processGroup('css', groups.css),
    processGroup('js', groups.js),
    processGroup('html', groups.html)
  ]);

  return {
    css: cssPath,
    js: jsPath,
    html: htmlPath
  };
};